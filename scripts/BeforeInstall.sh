#!/usr/bin/env bash
set -e

export $WEBAPP=/home/ubuntu/cloud_app
export $SCRIPT=/home/ubuntu/scripts

if [ -d $WEBAPP ]
then
    rm -rf $WEBAPP
fi

if [ -d $SCRIPT ]
then
    rm -rf $SCRIPT
fi



# install pm2 module globaly
npm install -g pm2
pm2 update