#!/usr/bin/env bash

WEBAPP=/home/ubuntu/cloud_app
if [ ! -z "$DEPLOYMENT_GROUP_NAME" ]; then
 export NODE_ENV="production"
fi

cd $WEBAPP
NODE_ENV=production pm2 start npm -- start
   