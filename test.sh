#!/bin/bash

source /Users/payten/Development/nyu/cle/11/apache-tomcat-8.0.21/bin/setenv.sh
/Users/payten/Development/apache-maven-3.2.1/bin/mvn clean install sakai:deploy -Dsakai.skin.target=morpheus-nyu -Dsakai.skin.customization.file=/Users/payten/Development/nyu/cle/11/sakai11/reference/library/src/morpheus-master/sass/_nyu.scss -Dmaven.tomcat.home=/Users/payten/Development/nyu/cle/11/apache-tomcat-8.0.21  -Dsakai.cleanup=true



CKEDITOR_DIRECTORY="/Users/payten/Development/nyu/cle/11/apache-tomcat-8.0.21/webapps/library/editor/ckextraplugins/"

let TRIES=0
let MAX_TRIES=5

while [ $TRIES -lt $MAX_TRIES ]; do
    echo "Try to add Mediasite:" $TRIES 
    if [ -d "$CKEDITOR_DIRECTORY" ]; then
      echo "Copying Mediasite plugin!"
      cp -r  ~/Development/nyu/NYUClasses/deploy/resources/tomcat-deploy/webapps/library-mediasite/editor/ckextraplugins/Mediasite $CKEDITOR_DIRECTORY
      break
    fi

    let TRIES+=1
    sleep 2
done

if [ "$TRIES" -eq "$MAX_TRIES" ]; then
    echo "Unable to copy across Mediasite plugin"
fi