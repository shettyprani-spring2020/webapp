#!/usr/bin/env bash

WEBAPP=/home/ubuntu/cloud_app
SCRIPT=/home/ubuntu/scripts
APPSPEC=/home/ubuntu/appspec.yml 

if [ -d $WEBAPP ]
then
    rm -rf $WEBAPP
fi

if [ -d $SCRIPT ]
then
    rm -rf $SCRIPT
fi
if [ -f $APPSPEC]
then
    rm -f $APPSPEC
fi


# install pm2 module globaly
npm install -g pm2
pm2 update