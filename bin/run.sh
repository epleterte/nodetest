#!/bin/sh

[ -e node_modules/nodetest ] || ( mkdir -p node_modules; cd node_modules; ln -s ../src nodetest; )

node node_modules/nodetest/server.js $*
