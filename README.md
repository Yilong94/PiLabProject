# Project Cyclops

Project Cyclops seeks to track and analyze the usage of the PiLab in order to provide a reliable assessment of space usage. It utilizes computer vision techniques to monitor movement in and out of the room and pushes data into a local database for data storage. A web framework is used to extract and publish the data on a user-friendly and interactive web application using graphs and charts. 

**Display number of people currently in the pi lab**

![1](https://github.com/Yilong94/PiLabProject/blob/master/screenshots/CurrentCount.png)

**Display number of people over the past 4 hours with a line chart**

![2](https://github.com/Yilong94/PiLabProject/blob/master/screenshots/LiveLineChart.png)

**Input from user**

![3](https://github.com/Yilong94/PiLabProject/blob/master/screenshots/UserInput.png)

**Display number of people on average with a line chart**

![4](https://github.com/Yilong94/PiLabProject/blob/master/screenshots/HistoricalLineChart.png)

**Display the distribution of crowdedness with a pie chart**

![5](https://github.com/Yilong94/PiLabProject/blob/master/screenshots/HistoricalPieChart.png)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

* Python 2.7
* MacOs/Windows operating system
* Web browser (chrome, firefox)

### Installing

1. Git clone the project into local repo
2. Create a virtual environment and install the requirements.py
```
virtualenv venv
source venv/bin/activate # rmb to activate the virtual env
pip install requirements.py
```
2. On command line/terminal, cd to the top-level directory of the project (i.e. directory containing 'app', 'run.py')
3. Set username and password to access MySQL database

MacOS:
```
export USERNAME=xxx
export PASSWORD=xxx
```
Windows:
```
set USERNAME=xxx
set PASSWORD=xxx
```
4. Execute the following code to start the web application on local server
```
flask run
```

## Built With

* [Flask](http://flask.pocoo.org/) - The web framework used
* [d3js](https://d3js.org/) - Data visualization library  

## Authors
* **Lai Jun Kang** - *Hardware and CV*
* **Tan Yi Long** - *Web application*

