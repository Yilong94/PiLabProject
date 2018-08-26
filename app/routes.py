from app import app, socketio, databaseFilepath, thread, thread_lock, db_connector

from datetime import date, datetime, timedelta
import time
from flask import render_template
from flask_socketio import emit

from database import getLogCSV, pushLogCSV

@app.route("/")
def index():
    return render_template('index.html', async_mode=socketio.async_mode)

#functionality 1: continuously send data to client on current count
def background_thread():
    '''
    Background thread for regular update of the web application for live count and live graph 
    '''
    while True:
        newcount = int(db_connector.getLastLog()[2])
        socketio.emit('currentCount', newcount, namespace = '/pilab')
        df = db_connector.getLiveLog(hour=24)
        data = db_connector.getLiveChartData(df)
        socketio.emit('liveGraph', data, namespace = '/pilab')

        # check every minute since the database is updated every minute
        # TODO: this seems like a bad idea..maybe can change this
        socketio.sleep(1)

#functionality 2: receive button call from client upon inputting start and end dates
@socketio.on('getChart', namespace='/pilab')
def getDates(mydates):
    '''
    Display the charts based on the given time period as chosen by the user
    '''
    startDate = mydates['start_date']
    endDate = mydates['end_date']
    startTime = mydates['start_time']
    endTime = mydates['end_time']

    try:
        startTime = datetime.strptime(startTime, '%I : %M %p')
        endTime = datetime.strptime(endTime, '%I : %M %p')
    except:
        startTime = ""
        endTime = ""

    # need to reformat time to 1970 for mysql querying
    stddate = date(1970,1,1)
    startTime = datetime.combine(stddate, startTime.time())
    endTime = datetime.combine(stddate, endTime.time())

    # CASE 1: dates are not provided
    if startDate == "" or endDate == "":
        startDate, endDate = db_connector.getFirstAndLastDate()
    
    # CASE 2: dates are provided
    elif startDate != "" and endDate != "":
        startDate = datetime.strptime(str(startDate), '%Y-%m-%d')
        endDate = datetime.strptime(str(endDate), '%Y-%m-%d')
    
    df = db_connector.getLog(startDate, endDate, startTime, endTime)
    linedata = db_connector.getChartData(df)
    piedata = db_connector.getPieChartData(df)
    emit('lineChart', linedata)
    emit('pieChart', piedata)

@socketio.on('connect', namespace = '/pilab')
def pilab_connect():
    ''' 
    Start the background thread upon connecting
    '''
    global thread
    with thread_lock:
        if thread is None:
            thread = socketio.start_background_task(target=background_thread)
