/*
Add <script src="https://queryplayground.com/js/widgets.js"></script> to your webpage
To add a count(*) add something similar to
<p>There are <span class="socrata_count" data-url="https://data.seattle.gov/resource/a4j2-uu8v.json?$select=count(*)&$where=completed_date IS NULL"></span> open Seattle Police records requests.</p>

*/
if (typeof console == "undefined") {
    this.console = {log: function() {}};
}

function updateItemWithSimpleCount(item, data) {
  var url = item.attr('data-url');    
  item.html(data[0][Object.keys(data[0])[0]]+'<i class="fa fa-info-circle info" data-toggle="popover" data-placement="bottom" title=\'<a href="'+url+'">'+url+'</a>\'></i>');
  $('[data-toggle="popover"]').popover({
  trigger: "manual",html:true
}).on("click", function(e) {
  e.preventDefault();
}).on("mouseenter", function() {
  var _this = this;
  $(this).popover("show");
  $(this).siblings(".popover").on("mouseleave", function() {
    $(_this).popover('hide');
  });
}).on("mouseleave", function() {
  var _this = this;
  setTimeout(function() {
    if (!$(".popover:hover").length) {
      $(_this).popover("hide")
    }
  }, 100);
});    
}

function handleSimpleCount() {
  $.each($('.socrata_count'), function(item) {
    console.log($(this).attr('data-url'))
    var socrataUrl = $(this).attr('data-url');
    var item = $(this)
    $.get(socrataUrl, function(data) {
      updateItemWithSimpleCount(item, data);
    });
  });
  
}

function handleSimpleCountsSum() {
  $.each($('.socrata_sum_of_counts'), function(item) {
    console.log($(this).attr('data-urls'))
    var socrataUrls = $(this).attr('data-urls');
    var item = $(this);
    var total = 0;
    $.each(socrataUrls.split(';'), function(i, url) {
        var data = JSON.parse($.ajax({
            type: "GET",
            url: url,
            async: false
        }).responseText);
        total += parseInt(data[0][Object.keys(data[0])[0]]);
    });
    item.html(total+'<i class="fa fa-info-circle info"></i>');
  });
}
function pieChart(item) {
    url = 'https://'+item.attr('data-domain')+'/resource/'+item.attr('data-datasetid')+'.json?$select=count(*) as count';
    var data = JSON.parse($.ajax({
        type: "GET",
        url: url,
        async: false
    }).responseText);
    var total = data[0]['count'];
    url = 'https://'+item.attr('data-domain')+'/resource/'+item.attr('data-datasetid')+'.json?$select=CASE('+item.attr('data-column')+' IS NULL,%27Unknown%27,'+item.attr('data-column')+' IS NOT NULL,'+item.attr('data-column')+') as column,count(*) as count,count(*)/'+total+'*100 as percentage&$group='+item.attr('data-column')+'&$order=percentage DESC';
    var data = JSON.parse($.ajax({
        type: "GET",
        url: url,
        async: false
    }).responseText);
    
    var infoHtml = '<i class="fa fa-info-circle info" data-toggle="popover" data-placement="bottom" title=\'<a href="'+url+'">'+url+'</a>\'></i>'
    item.append('<canvas></canvas><div class="chart-legend small"></div>')
    var ctx = item.find('canvas').get(0).getContext("2d");
    chartData = [];
    $.each(data, function(i,v) {
        
        chartData.push( {
          value : parseInt(v['count']),
          percentage : Math.round(parseFloat(v['percentage'])),
          label : v['column'],
          color: window.colors[i],
          highlight: window.highlightColors[i]
        }) ;
    });
    var options = { legendTemplate : '<ul>'
                  +'<% for (var i=0; i<chartData.length; i++) { %>'
                    +'<li>'
                    +'<span style=\"background-color:<%=chartData[i].color%>\"></span>'
                    +'<% if (chartData[i].label) { %><%= chartData[i].label %><% } %>'
                    +'<% if (chartData[i].percentage) { %> <%= chartData[i].percentage %>%<% } %>'
                    +'<% if (chartData[i].value) { %> (<%= chartData[i].value %>/<%= total %>)<% } %>'
                    
                  +'</li>'
                +'<% } %>'
              +'</ul>'
  } ;
    console.log(JSON.stringify(chartData))
    var myChart = new Chart(ctx).Pie(chartData,options);
    item.find('.chart-legend').html(myChart.generateLegend());
}
function table(item, url) {
    //url = 'https://'+item.attr('data-domain')+'/resource/'+item.attr('data-datasetid')+'.json?$select=count(*) as count';
    var data = JSON.parse($.ajax({
        type: "GET",
        url: url,
        async: false
    }).responseText);
    var total = parseInt(data[0]['count']);
    var html = '<table class="table small">';
    var labels = item.attr('data-labels').split(',');
    var cols = item.attr('data-cols').split(',');
    html += '<tr>';
    
    if (item[0].hasAttribute("data-show-row-num")) {
      if (item.attr("data-show-row-num") == 'true') {
        show_row_num = true;
      } else {
        show_row_num = false;
      }
    } else {
      show_row_num = false;
    }
    if (show_row_num) {
      html += '<th></th>';
    }
    $.each(labels, function(i, v) {
        html += '<th>'+v+'</th>';
    })
    html += '</tr>';
    $.each(data, function(i, v){
        html += '<tr>';
        if (show_row_num) {
          html += '<td>'+(i+1)+'</td>';
        }
        $.each(cols, function(j, v2) {
            var cell = data[i][v2];
            if (!cell) {
              cell = '';
            }
            html += '<td>'+cell+'</td>';
        })
        html += '</tr>';
    })
    html += '</table>';
    item.append(html);
}
function table_of_boolean_percentages(item) {
    url = 'https://'+item.attr('data-domain')+'/resource/'+item.attr('data-datasetid')+'.json?$select=count(*) as count';
    var data = JSON.parse($.ajax({
        type: "GET",
        url: url,
        async: false
    }).responseText);
    var total = parseInt(data[0]['count']);
    var html = '<h3>'+item.attr('data-heading')+'</h3><table class="table small">';
    var labels = item.attr('data-labels').split(',');
    $.each(item.attr('data-columns').split(','), function(i, v){
        url = 'https://'+item.attr('data-domain')+'/resource/'+item.attr('data-datasetid')+'.json?$select=count(*) as count&'+v+'='+item.attr('data-trueis');
        var data = JSON.parse($.ajax({
            type: "GET",
            url: url,
            async: false
        }).responseText);    
        html += '<tr><th>'+labels[i]+'</th><td>'+Math.round(parseInt(data[0]['count'])/total*100)+'% ('+data[0]['count']+'/'+total+')</td></tr>';
    })
    html += '</table>';
    item.html(html);
}
function line_chart(item, url) {
    var data = JSON.parse($.ajax({
        type: "GET",
        url: url,
        async: false
    }).responseText);
  var labels = [];
  var counts = [];
  $.each(data, function(i, v) {
    labels.push(moment(v[item.attr('data-x')]).format(item.attr('data-date-format')));
    counts.push(parseInt(v[item.attr('data-y')]));
  });
	// line chart data
	var chartData = {
		labels : labels,
		datasets : [
		    {
				fillColor : "rgba(172,194,132,0.4)",
				strokeColor : "#ACC26D",
				pointColor : "#fff",
				pointStrokeColor : "#9DB86D",
				data : counts,
                pointHighlightFill: "blue",
                pointHighlightStroke: "rgba(220,220,220,1)"
			}
		]
    
	}
	item.append('<canvas></canvas>');
	item.find('canvas').css('width', '100%');
	item.find('canvas').height(item.height() - item.find('h3').height());
	
	// get line chart canvas
	var ctx = item.find('canvas').get(0).getContext('2d');

	// draw line chart
	new Chart(ctx).Line(chartData,{pointHitDetectionRadius:5});
}
function horizontal_bar_chart(item, url) {
    //url = 'https://'+item.attr('data-domain')+'/resource/'+item.attr('data-datasetid')+'.json?$query='+item.attr('data-query');
    var infoHtml = '<i class="fa fa-info-circle info" data-toggle="popover" data-placement="bottom" title=\'<a href="'+url+'">'+url+'</a>\'></i>'
    var html = '<canvas></canvas>';
    item.append(html);
    console.log(url);
    var data = JSON.parse($.ajax({
        type: "GET",
        url: url,
        async: false
    }).responseText).reverse();
    
    var labels = _.pluck(data,"customer_name");
    
    var ctx = item.find('canvas').get(0).getContext("2d");
    var linedata = {
     labels : labels,
     datasets : [
         {
             fillColor : "rgba(220,220,220,0.5)",
             strokeColor : "rgba(220,220,220,1)",
            pointColor : "rgba(220,220,220,1)",
            pointStrokeColor : "rgba(220,220,220,1)",
            data : _.map(_.pluck(data,"number_of_requests"), function(num) { return parseInt(num) })
        }
    ]
    }
    new Chart(ctx).HorizontalBar(linedata);
}
function dataset_statuses(item) {
    
    var html = '<table class="table small">';
    datasets = item.attr('data-datasetids').split(',');
    $.each(datasets, function(i, v){
    	
        url = 'https://'+item.attr('data-domain')+'/api/views/'+v+'.json';
        var data = JSON.parse($.ajax({
	        type: "GET",
	        url: url,
	        async: false
	    }).responseText);
	    hours = (moment.duration(moment().diff(moment(data['rowsUpdatedAt']*1000))).asHours());
    	if (hours > 24) {
            html += '<tr style="background:red;color:#FFF;">';
    	} else {
            html += '<tr>';
    	}
        html += '<td>'+data['name']+'</td>';
        html += '<td>'+hours+' hours</td>';
        html += '</tr>';
    })
    html += '</table>';
    item.append(html);
}
$('body').on('click', '.copy', function() {
  $(this).text(decodeURI($(this).attr('data-copy-this')));
  var range = document.createRange();  
  range.selectNode($(this));  
  window.getSelection().addRange(range);  

  try {  
    // Now that we've selected the anchor text, execute the copy command  
    var successful = document.execCommand('copy');  
    var msg = successful ? 'successful' : 'unsuccessful';  
    console.log('Copy email command was ' + msg);  
  } catch(err) {  
    console.log('Oops, unable to copy');  
  }  

  // Remove the selections - NOTE: Should use
  // removeRange(range) when it is supported  
  window.getSelection().removeAllRanges();  
  $(this).text('');
})
function handleSODAPlayground() {
  $.each($('.sodaplayground'), function(item) {
    item = $(this);
    url = '';
    try {
      if (item[0].hasAttribute("data-url")) {
        var url = item.attr('data-url');  
      } else {
        if (item.attr('data-type') == 'pie_chart') {
          url = 'https://'+item.attr('data-domain')+'/resource/'+item.attr('data-datasetid')+'.json?$select=count(*) as count';
          var data = JSON.parse($.ajax({
              type: "GET",
              url: url,
              async: false
          }).responseText);
          var total = data[0]['count'];
          url = 'https://'+item.attr('data-domain')+'/resource/'+item.attr('data-datasetid')+'.json?$select=CASE('+item.attr('data-column')+' IS NULL,%27Unknown%27,'+item.attr('data-column')+' IS NOT NULL,'+item.attr('data-column')+') as column,count(*) as count,count(*)/'+total+'*100 as percentage&$group='+item.attr('data-column')+'&$order=percentage DESC';
          
        } else {
          //data-domain="opendata.socrata.com" data-datasetid="aspn-jfpg" data-q="disclosure"
          if (item[0].hasAttribute("data-q")) {
            url = 'https://'+item.attr('data-domain')+'/resource/'+item.attr('data-datasetid')+'.json?$q='+item.attr("data-q");
          } else if (item[0].hasAttribute("data-query")) {
            url = 'https://'+item.attr('data-domain')+'/resource/'+item.attr('data-datasetid')+'.json?$query='+item.attr("data-query"); 
          }
          
          
        }
      }
      if (url) {
      var data = JSON.parse($.ajax({
          type: "GET",
          url: url,
          async: false
      }).responseText).reverse();
      }
      var heading = item.attr('data-heading');
      var variables = {};
      for (var i = 0, atts = item[0].attributes, n = atts.length, arr = []; i < n; i++){
        if (atts[i].nodeName.indexOf('data-variable-') > -1) {
          variables[atts[i].nodeName.slice('data-variable-'.length)] = data.length;
        }
      }
      for (var key in variables) {
        heading = heading.replace('{{ '+key+' }}', variables[key]);
      }
      if (url) {
      var infoHtml = '<i class="fa fa-info-circle info" data-toggle="popover" data-placement="bottom" title=\'<a href="'+url+'">'+url+'</a>\'></i>'
      } else {
      	infoHtml = '';
      	}
      	var htmlToCopy = $(this)[0].outerHTML;
      	var copyHtml = '<i class="fa fa-clipboard copy" data-copy-this="'+encodeURI(htmlToCopy)+'"></i>';
      	item.append('<h3>'+heading+infoHtml+copyHtml+'</h3>');
      	
    } catch (e) {
      console.log(e);
    }
    try {
        switch ($(this).attr('data-type')) {
            case "pie_chart":
                pieChart($(this));
                break;
            case "table":
                table($(this), url);
                break;
            case "table_of_boolean_percentages":
                table_of_boolean_percentages($(this));
                break;
            case "horizontal_bar_chart":
                horizontal_bar_chart($(this), url);
                break;
            case "line_chart":
                line_chart($(this), url);
                break;
            case "dataset_statuses":
            	dataset_statuses($(this));
            	break;
        }   
    } catch (e) {
    	
        console.log($(this).attr('data-type')+' '+e)
    }
  }); 
}
function main() {
    window.colors = [];
    window.highlightColors = [];
    for (var i=0;i<100;i++) {
        r = Math.floor(Math.random() * 200);
        g = Math.floor(Math.random() * 200);
        b = Math.floor(Math.random() * 200);
        c = 'rgb(' + r + ', ' + g + ', ' + b + ')';
        h = 'rgb(' + (r+20) + ', ' + (g+20) + ', ' + (b+20) + ')';
        window.colors.push(c);
        window.highlightColors.push(h)
    }
    var plugins = ['https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.12.0/moment.min.js', 'https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js', 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/1.0.2/Chart.min.js', 'https://rawgit.com/tomsouthall/Chart.HorizontalBar.js/master/Chart.HorizontalBar.js'];
    setTimeout(function(){var originalLeave = $.fn.popover.Constructor.prototype.leave;
$.fn.popover.Constructor.prototype.leave = function(obj){
  var self = obj instanceof this.constructor ?
    obj : $(obj.currentTarget)[this.type](this.getDelegateOptions()).data('bs.' + this.type)
  var container, timeout;

  originalLeave.call(this, obj);

  if(obj.currentTarget) {
    container = $(obj.currentTarget).siblings('.popover')
    timeout = self.timeout;
    container.one('mouseenter', function(){
      //We entered the actual popover – call off the dogs
      clearTimeout(timeout);
      //Let's monitor popover content instead
      container.one('mouseleave', function(){
        $.fn.popover.Constructor.prototype.leave.call(self, self);
      });
    })
  }
};}, 1000);
    $.each(plugins, function(i,url){
        if (url.endsWith('.js')) {
            var script = document.createElement("SCRIPT");
            script.src = url;
            script.type = 'text/javascript';
            document.getElementsByTagName("head")[0].appendChild(script);
        } else  {
            $('head').append('<link rel="stylesheet" type="text/css" href="'+url+'">');
        }
    })
    setTimeout(function(){handleSimpleCount();
    handleSimpleCountsSum();handleSODAPlayground();},1000)
    
    
    


}

if (!window.jQuery) {
// Anonymous "self-invoking" function
(function() {
    // Load the script
    var script = document.createElement("SCRIPT");
    script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js';
    script.type = 'text/javascript';
    document.getElementsByTagName("head")[0].appendChild(script);

    // Poll for jQuery to come into existance
    var checkReady = function(callback) {
        if (window.jQuery) {
            callback(jQuery);
        }
        else {
            window.setTimeout(function() { checkReady(callback); }, 100);
        }
    };

    // Start polling...
    checkReady(function($) {
        main();
    });
})();
} else {
    main();
}
