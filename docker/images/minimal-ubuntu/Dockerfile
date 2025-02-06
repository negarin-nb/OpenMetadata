#  Copyright 2021 Collate
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#  http://www.apache.org/licenses/LICENSE-2.0
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

# Dockerfile - minimal-ubuntu
# usage: docker build -t minimal-ubuntu:0.1 .

FROM ubuntu:24.04

# environment variables
ENV DEBIAN_FRONTEND=noninteractive

# update
RUN apt update -y && \
    # editor
    apt install -y vim nano && \
    # general
    apt install -y man sudo sshpass less jq ntp bc && \
    # network commands
    apt install -y net-tools iputils-ping dnsutils lsof curl wget telnet

# python
RUN apt install -y software-properties-common && \
    add-apt-repository -y ppa:deadsnakes/ppa && \
    apt update -y && \
    apt install -y python3.9 python3.9-distutils && \
    update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.9 1 && \
    apt install -y python3-pip

# java
RUN apt install -y openjdk-17-jdk
# maven
RUN apt install -y maven

# yarn
RUN apt install -y nodejs && \
    apt install -y npm && \
    npm install -y --global yarn

#antlr
RUN	echo '#!/usr/bin/java -jar' > /usr/local/bin/antlr4 && \
	curl https://www.antlr.org/download/antlr-4.9.2-complete.jar >> /usr/local/bin/antlr4 && \
	chmod 755 /usr/local/bin/antlr4

# supervisord
RUN pip install supervisor && \
    mkdir -p /var/log/supervisord/

# converts the dash to bash terminal for easy scripting
RUN update-alternatives --install /bin/sh sh /bin/bash 100 && \
    update-alternatives --install /bin/sh sh /bin/dash 200 && \
    echo 1 | update-alternatives --config sh