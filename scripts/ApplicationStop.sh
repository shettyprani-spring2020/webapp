#!/usr/bin/env bash
set -e

export $WEBAPP=/home/ubuntu/cloud_app

cd $WEBAPP
pm2 stop www || true