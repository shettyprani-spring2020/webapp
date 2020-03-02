#!/usr/bin/env bash
set -e

cd /home/ubuntu/cloud_app
pm2 stop www || true