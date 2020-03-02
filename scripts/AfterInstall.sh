#!/usr/bin/env bash
set -e

WEBAPP=/home/ubuntu/cloud_app
ENV="production"
USER="ec2-user"
if [ ! -z "$DEPLOYMENT_GROUP_NAME" ]; then
    export NODE_ENV=$ENV

    hasEnv = `grep "export NODE_ENV" ~/.bash_profile | cat`
    if [ -z "$hasEnv"]; then
        echo "export NODE_ENV=$ENV" >> ~/.bash_profile
    else
        sed -i "/export NODE_ENV=\b/c\export export NODE_ENV=$ENV" ~/.bash_profile
    fi
fi

# add node to startup
hasRc=`grep "su -l $USER" /etc/rc.d/rc.local | cat`
if [ -z "$hasRc" ]; then
    sudo sh -c "echo 'su -l $USER -c \"cd ~/node;sh ./run.sh\"' >> /etc/rc.d/rc.local"
fi