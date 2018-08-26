from flask import Flask
from flask_socketio import SocketIO
from threading import Lock 
import os
from DatabaseConnector import DatabaseConnector

# Set this variable to "threading", "eventlet" or "gevent" to test the
# different async modes, or leave it set to None for the application to choose
# the best option based on installed packages.
async_mode = None

app = Flask(__name__)
socketio = SocketIO(app, async_mode = async_mode)
thread = None
thread_lock = Lock()

databaseFilepath = 'app/database/record.csv'
username = os.getenv('USERNAME')
password = os.getenv('PASSWORD')
host = 'pilab.ct0oc3ontoyk.ap-southeast-1.rds.amazonaws.com'
database = 'pilab'
csvfile = "app/Log.csv"
db_connector = DatabaseConnector(username, password, host, database, csvfile)

from app import routes