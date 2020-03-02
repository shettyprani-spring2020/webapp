#!/usr/bin/env bash

cd /home/ubuntu/cloud_app
pm2 start npm -- run start:prod
   