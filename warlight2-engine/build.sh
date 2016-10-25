#!/bin/sh

javac -sourcepath src/ -d bin/ -cp lib/java-json.jar `find src/ -name '*.java' -regex '^[./A-Za-z0-9]*$'`