package org.openmetadata.service.governance.workflows.elements.nodes.automatedTask;

import static org.openmetadata.service.governance.workflows.Workflow.getFlowableElementId;

import org.flowable.bpmn.model.BoundaryEvent;
import org.flowable.bpmn.model.BpmnModel;
import org.flowable.bpmn.model.EndEvent;
import org.flowable.bpmn.model.FieldExtension;
import org.flowable.bpmn.model.Process;
import org.flowable.bpmn.model.SequenceFlow;
import org.flowable.bpmn.model.ServiceTask;
import org.flowable.bpmn.model.StartEvent;
import org.flowable.bpmn.model.SubProcess;
import org.openmetadata.schema.governance.workflows.elements.nodes.automatedTask.RunIngestionPipelineTaskDefinition;
import org.openmetadata.service.governance.workflows.elements.NodeInterface;
import org.openmetadata.service.governance.workflows.elements.nodes.automatedTask.impl.RunIngestionPipelineImpl;
import org.openmetadata.service.governance.workflows.flowable.builders.EndEventBuilder;
import org.openmetadata.service.governance.workflows.flowable.builders.FieldExtensionBuilder;
import org.openmetadata.service.governance.workflows.flowable.builders.ServiceTaskBuilder;
import org.openmetadata.service.governance.workflows.flowable.builders.StartEventBuilder;
import org.openmetadata.service.governance.workflows.flowable.builders.SubProcessBuilder;
import org.openmetadata.service.util.JsonUtils;

public class RunIngestionPipelineTask implements NodeInterface {
  private final SubProcess subProcess;
  private final BoundaryEvent runtimeExceptionBoundaryEvent;

  public RunIngestionPipelineTask(RunIngestionPipelineTaskDefinition nodeDefinition) {
    String subProcessId = nodeDefinition.getName();

    SubProcess subProcess = new SubProcessBuilder().id(subProcessId).build();

    StartEvent startEvent =
        new StartEventBuilder().id(getFlowableElementId(subProcessId, "startEvent")).build();

    ServiceTask runIngestionWorkflow =
        getRunIngestionWorkflowServiceTask(
            subProcessId,
            nodeDefinition.getConfig().getWaitForCompletion(),
            nodeDefinition.getConfig().getTimeoutSeconds(),
            JsonUtils.pojoToJson(nodeDefinition.getInputNamespaceMap()));

    EndEvent endEvent =
        new EndEventBuilder().id(getFlowableElementId(subProcessId, "endEvent")).build();

    subProcess.addFlowElement(startEvent);
    subProcess.addFlowElement(runIngestionWorkflow);
    subProcess.addFlowElement(endEvent);

    subProcess.addFlowElement(new SequenceFlow(startEvent.getId(), runIngestionWorkflow.getId()));
    subProcess.addFlowElement(new SequenceFlow(runIngestionWorkflow.getId(), endEvent.getId()));

    this.runtimeExceptionBoundaryEvent = getRuntimeExceptionBoundaryEvent(subProcess);
    this.subProcess = subProcess;
  }

  @Override
  public BoundaryEvent getRuntimeExceptionBoundaryEvent() {
    return runtimeExceptionBoundaryEvent;
  }

  private ServiceTask getRunIngestionWorkflowServiceTask(
      String subProcessId,
      boolean waitForCompletion,
      long timeoutSeconds,
      String inputNamespaceMap) {
    FieldExtension waitExpr =
        new FieldExtensionBuilder()
            .fieldName("waitForCompletionExpr")
            .fieldValue(String.valueOf(waitForCompletion))
            .build();
    FieldExtension timeoutSecondsExpr =
        new FieldExtensionBuilder()
            .fieldName("timeoutSecondsExpr")
            .fieldValue(String.valueOf(timeoutSeconds))
            .build();

    FieldExtension inputNamespaceMapExpr =
        new FieldExtensionBuilder()
            .fieldName("inputNamespaceMapExpr")
            .fieldValue(inputNamespaceMap)
            .build();

    FieldExtension pipelineServiceClientExpr =
        new FieldExtensionBuilder()
            .fieldName("pipelineServiceClientExpr")
            .expression("${PipelineServiceClient}")
            .build();

    return new ServiceTaskBuilder()
        .id(getFlowableElementId(subProcessId, "triggerIngestionWorkflow"))
        .implementation(RunIngestionPipelineImpl.class.getName())
        .addFieldExtension(waitExpr)
        .addFieldExtension(timeoutSecondsExpr)
        .addFieldExtension(inputNamespaceMapExpr)
        .addFieldExtension(pipelineServiceClientExpr)
        .setAsync(true)
        .build();
  }

  public void addToWorkflow(BpmnModel model, Process process) {
    process.addFlowElement(subProcess);
    process.addFlowElement(runtimeExceptionBoundaryEvent);
  }
}
