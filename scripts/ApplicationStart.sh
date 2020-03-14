#!/usr/bin/env bash

sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/home/ubuntu/cloud_app/cloudwatch-config.json \
    -s

cd /home/ubuntu/cloud_app
pm2 start npm -- run start:prod
   