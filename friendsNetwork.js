var dataset;
var dispatch = d3.dispatch('userInfo')
nodes = [];
links = [];

d3.json("instagramFriendsNetwork.json").then(function(data) {
  dataset = data;
  genViz()
});

function genViz() {
  width = 1900
  height = 1080
  
  jsonFix();
  
  console.log(nodes);
  console.log(links);
  
  max = d3.max(dataset, function(d) {return d.commonNumber})
  scale = d3.scaleQuantize().domain([0,max]).range([5,7,10,15,18])
  color = d3.scaleOrdinal(d3.schemeTableau10)
  
  var i = 0;
  simulation = d3.forceSimulation(nodes)
  .force('charge', d3.forceManyBody().strength(-70))
  .force('link', d3.forceLink(links).id(d => d.id).distance(200))
  .force('center', d3.forceCenter(width/2, height/2))
  .force('collide', d3.forceCollide(10))

  var svg = d3.select('#network').append('svg').attr('width', width).attr('height', height)
  
  var link = svg.append('g').attr("stroke", "#999")
  .attr("stroke-opacity", 0.6)
  .selectAll('line')
  .data(links).join('line')
  .attr('class', 'links')
  .attr('source', function(d) {return d.source.id})
  .attr('target', function(d) {return d.target.id})
  .attr('fill', 'grey')
  .attr('stroke-width', 1)
  
  var node = svg.append('g')
  .selectAll('circle')
  .data(nodes).join('circle')
  .attr('class', 'users')
  .attr('id', function (d) {return 'user' + d.id})
  .attr('r', function (d) {if(d.id == 'hlferreira27') return 10; else return scale(d.commonNumber)})
  .attr('fill', function(d) {return color(d.group)})
  .attr('stroke', 'white')
  .on('mouseover', function(d) {
    d3.select('.tooltip').remove()
    var tooltip = d3.select('body').append('div').attr('class', 'tooltip')
    tooltip.transition().duration(100)

    tooltip.html("User: ".bold() + d.id + "<br/>" + "Instagram: ".bold() + "<a href='https://www.instagram.com/" + d.id + "\'" + ">" + d.id + "</a>")
    .style('left', d3.event.pageX + "px").style('top', d3.event.pageY + "px")
  })
  .on('mouseout', function() {
    
    var tooltip = d3.select('.tooltip')
    tooltip.transition().duration(800).remove()

  })
  .on('click', function(d){ dispatch.call('userInfo', d,d);
  selectedUser.select("title").html("<a href='https://www.instagram.com/" + d.id + "\'" + ">Instagram Profile</a>").text('User: ' + d.id)
})

simulation.on('tick', function (d) {
  link.attr('x1', d => d.source.x)
  .attr('y1', d => d.source.y)
  .attr('x2', d => d.target.x)
  .attr('y2', d => d.target.y)
  
  node.attr('cx', d => d.x).attr('cy', d => d.y)
});
}

//this function is only here because i was lazy doing the JSON file
function jsonFix() {
  var passedUsers = []
  for (n in dataset) {
    nodes.push({"id": dataset[n].node, "commonNumber": dataset[n].commonNumber, "group": dataset[n].group});  
    for (i in dataset[n].followers) {
      
      var user = dataset[n].followers[i]
      if(passedUsers.indexOf(user) == -1)
      links.push({"source":  dataset[n].node, "target":  dataset[n].followers[i] });   
    }
    
    if(dataset[n].followers.length == 0){
      links.push({"source":  dataset[0].node, "target":  dataset[n].node});
    }
    passedUsers.push(dataset[n].node)
  }
}

dispatch.on('userInfo', function(d){
  unselectedLines = d3.selectAll("line").attr('class', 'unselectedLine')
  selectedLineSource = d3.selectAll("line[source=\'" + d.id + "\']")
  selectedLineTarget = d3.selectAll("line[target=\'" + d.id + "\']")
  selectedLineSource.attr('class', "selectedLine").raise()
  selectedLineTarget.attr('class', "selectedLine").raise()
})