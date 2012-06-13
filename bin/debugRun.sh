#!/bin/sh

[ -e node_modules/nodetest ] || ( mkdir -p node_modules; cd node_modules; ln -s ../src nodetest; )

hash node-inspector > /dev/null 2>&1 || { 
  echo "You need to install node-inspector to run the tests!" >&2
  echo "You can install it with npm" >&2
  echo "Run: npm install -g node-inspector" >&2
  exit 1 
}

node-inspector &

node --debug node_modules/nodetest/server.js $*

#kill node-inspector before ending 
kill $!
