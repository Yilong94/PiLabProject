$(document).ready(function(){
    namespace = '/pilab'

    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + namespace);

    socket.on('connect', function() {
        console.log('Connected with server')
    });


    socket.on('currentCount', function(d){
        var countObj = document.getElementById("count");
        countObj.innerHTML = d
        console.log(d);
    })


    socket.on('liveGraph', function(receivedData){

        if (typeof receivedData === 'string'){
            alert(receivedData);
            return;
        }

        //d3.select('svg').remove()
        //var parent = document.getElementById('livegraph');
        var child = document.getElementById('livegraphSVG');
        if (child !== null){
            child.parentNode.removeChild(child);    
        }
        
        var data = receivedData

        //function to convert date string into date object
        //var parseTime = d3.timeParse('%H:%M:%S');
        var parseDateTime = d3.timeParse('%Y-%m-%d %H:%M:%S' )

        var margin = {top: 5, right: 20, bottom: 30, left: 20};
        var width = 900 - margin.left - margin.right;
        var height = 500 - margin.top - margin.bottom;

        //arbitrary number for max people in pilab
        var maxcount = 15;

        var canvas = d3.select('#id_livegraph').append('svg')
                        .attr('width', width + margin.left + margin.right)
                        .attr('height', height + margin.top + margin.bottom)
                        .attr('id','livegraphSVG')
                        .attr('display', 'block')
                        .attr('margin', 'auto')
                        .style('margin', 'auto')
                        .style('display','block');

        //scale for x axis
        var x = d3.scaleTime()
            .domain(d3.extent(data, function(d){
                return parseDateTime(d.date+' '+d.time)
            }))
            //.domain([minTime, maxTime])
            .range([0, width]);

        //scale for y axis
        var y = d3.scaleLinear()
            .domain([0, maxcount])
            .range([height, 0]);

        var xAxis = d3.axisBottom()
            .scale(x)
            .ticks(d3.timeMinute.every(15)) 

        var yAxis = d3.axisLeft()
            .scale(y)
            .ticks(maxcount)

        var line = d3.line()
            .x(function(d){
                return x(d.datetime);
            })
            .y(function(d){
                return y(d.count);
            });

        var group = canvas.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        //to change the time from a string into a time object
        data.forEach(function(d){
            //combined date and time togeter to form one object 
            d.datetime = parseDateTime(d.date+' '+d.time);
            d.count = +d.count;
        });

        group.selectAll('path')
            .data([data])
            .enter()
                .append('path')
                .attr('d', line)
                .attr('fill','none')
                .attr('stroke', 'black')
                .attr('stroke-width', '1')

        group.append('g')
            .attr('transform', 'translate(0,'+height+')')
            .call(xAxis)

        group.append('g')
            .call(yAxis)

    })

    socket.on('lineChart', function(receivedData){
        console.log(receivedData);

        if (typeof receivedData === 'string'){
            alert(receivedData);
            return;
        }
        

        var child = document.getElementById('linechartSVG');
        if (child !== null){
            child.parentNode.removeChild(child);    
        }

        var data = receivedData;

        var parseTime = d3.timeParse('%H:%M:%S');

        var margin = {top: 50, right: 20, bottom: 30, left: 20};
        var width = 900 - margin.left - margin.right;
        var height = 500 - margin.top - margin.bottom;

        //arbitrary number for max people in pilab
        var maxcount = 10;

        var canvas = d3.select('#id_linechart').append('svg')
                        .attr('width', width + margin.left + margin.right)
                        .attr('height', height + margin.top + margin.bottom)
                        .attr('id','linechartSVG')
                        .style('margin', 'auto')
                        .style('display','block');

        // canvas.append('text')
        //  .attr('x', width/2)
        //  .attr('y', margin.top/2)
        //  .attr('text-anchor','middle')
        //  .style('font-size', '20px')
        //  .style('text-decoration','underline')
        //  .text('Averaged data across specified period')

        //scale for x axis
        var x = d3.scaleTime()
            //.domain([parseTime('00:00:00'), parseTime('23:59:00')])
            .domain(d3.extent(data, function(d){
                return parseTime(d.time)
            }))
            .range([0, width]);

        //scale for y axis
        var y = d3.scaleLinear()
            .domain([0, maxcount])
            .range([height, 0]);

        var xAxis = d3.axisBottom()
            .scale(x)
            .ticks(d3.timeHour.every(1))    //number of hours in a day
            .tickFormat(d3.timeFormat('%H:%M'));

        var yAxis = d3.axisLeft()
            .scale(y)
            .ticks(maxcount)

        var line = d3.line()
            .x(function(d){
                return x(d.time);
            })
            .y(function(d){
                return y(d.count);
            });

        var group = canvas.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        var highLimit = 6;
        var moderateLimit = 3;

        var highBox = group.append('rect')
            .attr('y',y(y.domain()[y.domain().length - 1]))
            .attr('width',width)
            .attr('height', y(highLimit) - y(y.domain()[y.domain().length - 1]))
            .attr('fill', 'rgba(255,0,0,0.2)')
            //.attr('opacity',0.2)
        var moderateBox = group.append('rect')
            .attr('y',y(highLimit))
            .attr('width',width)
            .attr('height', y(moderateLimit) - y(highLimit))
            .attr('fill','rgba(255,165,0,0.2)')
            //.attr('opacity',0.2)
        var lowBox = group.append('rect')
            .attr('y',y(moderateLimit))
            .attr('width',width)
            .attr('height',y(y.domain()[0]) - y(moderateLimit))
            .attr('fill','rgba(0,153,0,0.2)')
            //.attr('opacity',0.2)

        var rectSize = 18;
        var legendSpacing = 4;

        colorScale = d3.scaleOrdinal()
            .domain(['Low (0-2)', 'Moderate (3-5)', 'High (6-8)'])
            .range(['rgba(0,153,0,0.2)', 'rgba(255,165,0,0.2)', 'rgba(255,0,0,0.2)']);

        legendCanvas = canvas.append('g')
            .attr('transform','translate('+width/2+',10)');

        var legend = legendCanvas.selectAll('.legend')
            .data(colorScale.domain())
            .enter()
                .append('g')
                .attr('class','legend')
                .attr('transform', function(d, i){
                    var length = 150;
                    var horz = (i-1) * length;
                    return 'translate('+horz+',0)';
                });

        legend.append('rect')
            .attr('width', rectSize)
            .attr('height', rectSize)
            .style('fill', colorScale)
            .style('stroke', colorScale);

        legend.append('text')
            .attr('x', rectSize + legendSpacing)
            .attr('y', rectSize - legendSpacing)
            .text(function(d){
                return d;
            });

        //to change the time from a string into a time object
        data.forEach(function(d){
            d.time = parseTime(d.time);
            d.count = +d.count;
        });

        path = group.selectAll('path')
            .data([data])
            .enter()
                .append('path')
                .attr('d', line)
                .attr('fill','none')
                .attr('stroke', 'black')
                .attr('stroke-width', '1')

        group.append('g')
            .attr('transform', 'translate(0,'+height+')')
            .call(xAxis)

        group.append('g')
            .call(yAxis)

        //Addition of tooltip for line chart
        // var tooltip = d3.select('#id_linechart').append('div')
        //  .attr('class','tooltip');

        // tooltip.append('div')
        //  .attr('class','time')
        // tooltip.append('div')
        //  .attr('class', 'count')
        // tooltip.append('div')
        //  .attr('class', 'status')

        // path.on('mouseover', function(d){
        //  console.log(d[0].time)
        //  tooltip.select('.time').html(d.time);
        //  tooltip.select('.count').html(d.count);
        //  tooltip.select('.status').html(d.status)
        //  tooltip.style('display','block');
        // });

  //       path.on('mouseout', function(){
  //         tooltip.style('display','none');
  //       });
    })

    socket.on('pieChart', function(receivedData){

        // var data = [
        //  {'label':'Low (0-2)', 'minute':500},
        //  {'label':'High (6-8)', 'minute':400},
        //  {'label':'Moderate (3-5)', 'minute':200}
        // ]

        if (typeof receivedData === 'string'){
            return;
        }
        
        var child = document.getElementById('piechartSVG');
        if (child !== null){
            child.parentNode.removeChild(child);    
        }

        var data = receivedData;

        var width = 500;
        var height = 500;
        var radius = Math.min(width, height)/2;

        var color = d3.scaleOrdinal(d3.schemeSet2);
        
        var color = d3.scaleOrdinal()
            //.domain([1,2,3])
            .range([d3.rgb(0,153,0,0.2), d3.rgb(255,165,0,0.2),d3.rgb(255,0,0,0.2)])

        var donutWidth = 75;

        var legendRectSize = 18;
        var legendSpacing = 4;

        var canvas = d3.select('#id_piechart').append('svg')
            .attr('width', width )
            .attr('height', height)
            .attr('id', 'piechartSVG')
            .style('margin', 'auto')
            .style('display','block');

        var group = canvas.append('g')
            .attr('transform', 'translate('+width/2+','+height/2+')');

        var arc = d3.arc()
            .innerRadius(radius-donutWidth)
            .outerRadius(radius);

        var pie = d3.pie()
            .value(function(d){
                return d.minute;
            })
            .sort(null);

        var tooltip = d3.select('#id_piechart').append('div')
            .attr('class','tooltip');

        tooltip.append('div')
            .attr('class','label')
        tooltip.append('div')
            .attr('class', 'minute')
        tooltip.append('div')
            .attr('class', 'percent')

        data.forEach(function(d){
            d.minute = +d.minute
        })

        var path = group.selectAll('path')
            .data(pie(data))
            .enter()
                .append('path')
                .attr('d', arc)
                .attr('fill', function(d,i){
                    return color(d.data.label)
                })
                .each(function(d){this._current = d;});

        path.on('mouseover', function(d){
            var total = d3.sum(data.map(function(d){
                return d.minute
            }));
            var percent = Math.round(1000*d.data.minute/total)/10;
            tooltip.select('.label').html(d.data.label);
            tooltip.select('.minute').html(d.data.minute+' minutes');
            tooltip.select('.percent').html(percent+'%')
            tooltip.style('display','block');
        });

        path.on('mouseout', function(){
          tooltip.style('display','none');
        });

        path.on('mousemove', function(d){
          tooltip.style('top',(d3.event.layerY+10)+'px')
          tooltip.style('left',(d3.event.layerX+10)+'px')
        });

        var legend = group.selectAll('.legend')
          .data(color.domain())
          .enter()
            .append('g')
            .attr('class', 'legend')
            .attr('transform', function(d, i){
            var height = legendRectSize + legendSpacing;
            var offset = height * color.domain().length/2;
            var horz = -2*legendRectSize;
            var vertz = i * height - offset;
            return 'translate('+horz+','+vertz+')';
          });

        legend.append('rect')
            .attr('width', legendRectSize)
            .attr('height', legendRectSize)
            .style('fill', color)
            .style('stroke', color)

        legend.append('text')
          .attr('x', legendRectSize+legendSpacing)
          .attr('y', legendRectSize-legendSpacing)
          .text(function(d){
            return d;
          });

    });

    socket.on('historicalTable', function(receivedData){
        var data = receivedData;

        var columns = [
            {head: 'Date', cl:'center', html:function(row){
                return row.date;
            }},
            {head: 'Time', cl:'center', html:function(row){
                return row.time;
            }},
            {head: 'Count', cl:'center', html:function(row){
                return row.count;
            }},
            {head: 'Status', cl:'center', html:function(row){
                return row.status;
            }}
        ];

        console.log(data)
        //create table
        var table = d3.select('#id_fulltable').append('table')
            .style('margin', 'auto')

        //create table header
        table.append('thead').append('tr')
            .selectAll('th')
            .data(columns)
            .enter()
                .append('th')
                .attr('class', function(data){
                    return data.cl
                })
                .text(function(data){
                    return data.head
                });

        // var table2 = d3.select('#id_fulltable').append('table')

        //create table body
        table.append('tbody')
            .selectAll('tr')
            .data(data)
            .enter()
                .append('tr')
                .selectAll('td')
                .data(function(row, i){
                    return columns.map(function(c){
                        var cell = {}
                        d3.keys(c).forEach(function(k){
                            cell[k] = typeof c[k] == 'function' ? c[k](row,i) : c[k]
                        });
                        return cell;
                    })
                }).enter()
                .append('td')
                .html(function(d){
                    return d.html;
                })
                .attr('class', function(d){
                    return d.cl;
                })

    });

    //when client presses this button, 'start_date' and 'end_date' will be sent to the server side
    $('form#postDates').submit(function(event) {
        socket.emit('getChart', {start_date: $('#startdatepicker').val(), end_date: $('#enddatepicker').val(), start_time: $('#starttimepicker').val(), end_time: $('#endtimepicker').val()});
        var allChartTitle = document.getElementsByClassName('chartTitle');
        for (var i = 0;i<allChartTitle.length;i++){
            console.log(allChartTitle[i])
            allChartTitle[i].style.visibility = 'visible';
        }
        console.log('button pressed');
        return false
    });

})