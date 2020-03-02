#!/usr/bin/env bash

WEBAPP=/home/ubuntu/cloud_app
if [ ! -z "$DEPLOYMENT_GROUP_NAME" ]; then
 export NODE_ENV="production"
fi

cd $WEBAPP
pm2 start bin/www -n www -i 0
   