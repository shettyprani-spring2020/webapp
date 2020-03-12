#!/usr/bin/env bash
WEBAPP=/home/ubuntu/cloud_app
ENV="production"
USER="ec2-user"
if [ ! -z "$DEPLOYMENT_GROUP_NAME" ]; then
    export NODE_ENV=$ENV

    if [ ! -f "~/.bash_profile"]; then
        touch ~/.bash_profile
    fi

    hasEnv = `grep "export NODE_ENV" ~/.bash_profile | cat`
    if [ -z "$hasEnv"]; then
        echo "export NODE_ENV=$ENV" >> ~/.bash_profile
    else
        sed -i "/export NODE_ENV=\b/c\export export NODE_ENV=$ENV" ~/.bash_profile
    fi
fi
