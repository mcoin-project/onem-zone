#!/bin/bash
#title          :start.sh
#description    :This script start Node.js app.js in a loop
#author         :MihaiT
#date           :20170609
#version        :0.1
#usage          :./start.sh
#notes          :It's better to be started from a tmux session
#bash_version   :4.2.46(1)-release
###################################################################################################


ttime=$(date +'%d-%m-%Y %H:%M:%S')
mesToLog="The application started at $ttime""."
echo $mesToLog >> restartlog.txt

while true
do
	echo "Node.js will start the app.js application:"
	#Start the Node.js server for ONEm Simulator:
	node app.js

	#If we get here it means the Node.js crashed!
	sleep 2

	ttime=$(date +'%d-%m-%Y %H:%M:%S')
	mesToLog="\nThe application restarted at $ttime""."
	echo $mesToLog >> restartlog.txt
done

exit 100 #It's completely obnoxious to get to this line!

