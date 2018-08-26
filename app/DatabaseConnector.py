import mysql.connector
import datetime
from datetime import timedelta
import csv
import os
import pandas as pd

class DatabaseConnector:
    def __init__(self, username, password, host, database, csvfile=None):
        '''
        Initializes the class DatabaseConnector instance

        :param str username: Username for accessing MySQL
        :param str password: Password for accessing MySQL
        :param str host: Hostname of MySQL
        :param str database: Name of database schema to access
        :param str csvfile: Name of CSV file (optional)
        '''
        self.username = username
        self.password = password
        self.host = host
        self.database = database
        self.csvfile = csvfile
        print("Database connector initialized")

    def connect(self):
        '''
        Creates a connection object with MySQL database.
        '''
        try:
            conn = mysql.connector.connect(user=self.username,
                                            password=self.password,
                                            host=self.host,
                                            database=self.database
                                            )
            #print("Connected to database: {}".format(self.database))
            return conn
        except mysql.connector.Error as e:
            print(e)

    def getLastLog(self):
        '''
        Query database for the most recent row 

        :return: Tuple row from MySQL contianing (date, time, count, status)
        '''
        conn = self.connect()
        query = ("SELECT date,time,count,status FROM Log ORDER BY idLog DESC LIMIT 1")
        cursor = conn.cursor()
        cursor.execute(query)
        lastrow = cursor.fetchone()
        cursor.close()
        conn.close()
        return lastrow

    def getLiveLog(self, hour=4):
        '''
        Query database for the past # of hours

        :return: Dataframe from MySQL for further manipulation
        '''        
        conn = self.connect()
        query = ("SELECT date,time,count,status FROM Log "
                    "WHERE TIMESTAMP(date,cast(time as time)) > NOW() - INTERVAL %s HOUR")%(hour)
        df = pd.read_sql(query, con=conn)

        conn.close()
        return df

    # TODO: write a function to retrieve data from mysqldatabase
    def getLog(self,startDate, endDate, startTime, endTime):
        '''
        Query database based on given parameters

        :param datetime.datetime startTime: Find entries with time after startTime
        :param datetime.datetime endTime: Find entries with time before endTime
        :param datetime.date startDate: Find entries with date after startDate
        :param datetime.date endDate: Find entries with date before endDate
        :return: Dataframe from MySQL for further manipulation
        '''
        conn = self.connect()
        query = ("SELECT date,time,count,status FROM Log " 
                    "WHERE (date BETWEEN %s AND %s) AND " 
                    "(time BETWEEN %s AND %s)"
                )
        #query = query%(startDate.strftime('%Y-%m-%d'), endDate.strftime('%Y-%m-%d'), startTime.strftime('%Y-%m-%d %H:%M'), endTime.strftime('%Y-%m-%d %H:%M'))
        df = pd.read_sql(query, con=conn, params=(startDate, endDate, startTime, endTime))
        
        conn.close()
        return df

    def getLiveChartData(self, df):
        '''
        Data manipulation for display in live line chart

        :param Dataframe df: Dataframe from MySQL database
        :return: List of dictionary with date, time, count
        '''
        df = df.drop(labels=['status'], axis=1) # drop 'status' column
        data = []
        for i, row in df.iterrows():
            data.append({"date":row['date'].strftime('%Y-%m-%d'), "time":row['time'].strftime('%H:%M:%S'), "count":row['count']})
        return data

    def getChartData(self, df):
        '''
        Data manipulation for display in line chart

        :param Dataframe df: Dataframe from MySQL database
        :return: List of dictionary with averaged count and time
        '''
        df = df.drop(labels=['status'], axis=1) # drop 'status' column
        meaned = df.groupby('time', as_index=False).mean()
        data = []
        # formating data acceptable for d3js
        for i, row in meaned.iterrows():
            data.append({'time':row['time'].strftime('%H:%M:%S'), 'count':row['count']})
        return data
        

    def getPieChartData(self, df):
        '''
        Data manipulation for display in pie chart

        :param Dataframe df: Dataframe from MySQL database
        :return: List of dictionary with label and total number of minutes
        '''
        counted = df.groupby('status').size().reset_index(name='counts')
        counted['minute'] = counted.apply(lambda x:x['counts']*5, axis=1)
        data = []
        for i,row in counted.iterrows():
            if row['status']==0:
                label = 'Low (0-2)'
            elif row['status']==1:
                label = 'Moderate (3-5)'
            elif row['status']==2:
                label = 'High (6-8)'
            data.append({'minute':row['minute'], 'label':label})
        return data

    
    def pushLog(self, count, curr_datetime):
        '''
        Insert a new entry into databases with status logic

        :param int count: Number of people currently in the pilab
        :param datetime.datetime curr_datetime: Current datetime object
        '''
        # classify the status based on the current count
        # Low: 0-2
        if count>=0 and count<=2:
            status = 0
        # Moderate: 3-5
        elif count<=5:
            status = 1
        # High: >=6
        else:
            status = 2

        newrow = {'datetime':curr_datetime, 'count':count, 'status':status}

        try:
            self.pushLogCSV(newrow)
            self.pushLogSQL(newrow)
        except IOError as e:
            print(e)

    # TODO: write a function to update csv file
    def pushLogCSV(self, newrow):
        '''
        Insert a new entry into csv file

        :param dict newrow: A dictionary containing data to insert into database
        Contents of newrow:
            - datetime.datetime datetime: Current datetime
            - int count: Number of people currently
            - int status: 3-level variable indicating how crowded
        '''
        if not self.csvfile or os.path.isfile(self.csvfile) :
            raise IOError ('Error: CSV file does not exist')

        csvrow = [newrow['datetime'].strftime('%Y-%m-%d'), newrow['datetime'].strftime('%H:%M:%S'), newrow['count'], newrow['status']]
        with open(self.csvfile, 'a') as f:
            writer = csv.writer(f)
            writer.writerow(csvrow)
    # TODO: write a function to update mysql database 
    def pushLogSQL(self, newrow):
        '''
        Insert a new entry into MySQL database

        :param dict newrow: A dictionary containing data to insert into database
        Contents of newrow:
            - datetime.datetime datetime: Current datetime
            - int count: Number of people currently
            - int status: 3-level variable indicating how crowded
        :return: None
        '''
        conn = self.connect()
        cursor = conn.cursor()
        query = ("INSERT INTO Log "
                    "(date, time, count, status) "
                    "VALUES (%s, %s, %s, %s)"
                )
        curr_datetime = newrow['datetime']
        cursor.execute(query, (curr_datetime.date(),datetime.datetime(1970,1,1,curr_datetime.hour,curr_datetime.minute),newrow['count'],newrow['status']))
        conn.commit()
        
        cursor.close()
        conn.close()
        return

    def getFirstAndLastDate(self):
        '''
        # Query the database for the least and most recent date in the database

        :return: A tuple containing the least recent date and most recent date
        '''
        conn = self.connect()
        query = ("SELECT min(date), max(date) from Log")
        cursor = conn.cursor()
        cursor.execute(query)
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result

######################
##### TEST CASES #####
######################

def testGetLog(db):
    startDate = datetime.date(2018,4,1)
    endDate = datetime.date(2018,9,1)
    startTime = datetime.datetime(1970,1,1,9,0,0)
    endTime = datetime.datetime(1970,1,1,11,7,0)
    return db.getLog(startDate, endDate, startTime, endTime)

def testGetLiveLog(db):
    return db.getLiveLog()

def testGetLastLog(db):
    return db.getLastLog()

def testPushLog(db):
    curr_count = 5
    curr_datetime = datetime.datetime.now()
    db.pushLog(curr_count, curr_datetime)

def testgetChartData(db, df):
    return db.getChartData(db, df)  

def testgetPieChartData(db, df):
    return db.getPieChartData(df)    

def testgetLiveChartData(db, df):
    return db.getLiveChartData(df)   

def testGetFirstAndLastDate(db):
    return db.getFirstAndLastDate()


if __name__=="__main__":
    username = "pilabadmin"
    password = "pilabadmin"
    host = "pilab.ct0oc3ontoyk.ap-southeast-1.rds.amazonaws.com"
    database = "pilab"
    csvfile = "Log.csv"
    #csvfile = None
    db = DatabaseConnector(username,password,host,database, csvfile)

    #df = testGetLog(db)
    #print(df)
    #print(len(df))

    #testPushLog(db)

    #data = testgetChartData(db, df)
    #data = testgetPieChartData(db, df)

    #df_live = testGetLiveLog(db)
    #data = testgetLiveChartData(db, df_live)
    #print(data)

    #print(testGetLastLog(db))

    print(testGetFirstAndLastDate(db))


