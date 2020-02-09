var dataset;
var dispatch = d3.dispatch('userInfo')
nodes = [];
links = [];

color = d3.scaleOrdinal(d3.schemeTableau10)

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
  circleScale = d3.scaleQuantize().domain([0,max]).range([5,7,10,15,18])
  
  
  simulation = d3.forceSimulation(nodes)
  .force('charge', d3.forceManyBody().strength(-70))
  .force('link', d3.forceLink(links).id(d => d.id).distance(200))
  .force('center', d3.forceCenter(width/2, height/2))
  .force('collide', d3.forceCollide(10))
  
  var svg = d3.select('#network').append('svg').attr('width', width).attr('height', height).on('click', function(){d3.selectAll('line').attr('class', 'untouchedline').attr('stroke', 'grey')})
  
  //Brush
  var brush = svg.append('g').attr('class', 'brush')
              .call(d3.brush().extent([[0, 0], [width, height]])
              .on('start', bStart)
              .on('brush', brushed)
              .on('end', bEnd));

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
  .attr('id', function (d) {return d.id})
  .attr('r', function (d) {if(d.id == dataset[0].node) return 10; else return circleScale(d.commonNumber)})
  .attr('fill', function(d) {return color(d.group)})
  .on('mouseover', function(d) {
    d3.select('.tooltip').remove()
    var tooltip = d3.select('body').append('div').attr('class', 'tooltip')
    tooltip.transition().duration(100)

    tooltip.html("User: ".bold() + d.id + "<br/>" + "Instagram: ".bold() + "<a href='https://www.instagram.com/" + d.id + "\'" + ">" + d.id + "</a>")
          .style('left', (d3.event.pageX + 15) + "px").style('top', (d3.event.pageY - 40) + "px")
  })
  .on('mouseout', function() {
    var tooltip = d3.select('.tooltip')
    tooltip.transition().duration(800).remove()
  })
  .on('click', function(d){ dispatch.call('userInfo', d,d);d3.event.stopPropagation();})
  .call(d3.drag().on('start', dragStart).on('drag', dragged))

simulation.on('tick', function (d) {
  link.attr('x1', d => d.source.x)
  .attr('y1', d => d.source.y)
  .attr('x2', d => d.target.x)
  .attr('y2', d => d.target.y)
  
  node.attr('cx', d => d.x).attr('cy', d => d.y)
});

  function bStart(){
    console.log('brush has started')
  }

  function brushed(){
    selection = d3.event.selection
    if(selection != null)
    node.attr('class', function(d) {
      if(selection[0][0] <= d.x && selection[1][0] > d.x && selection[0][1] <= d.y && selection[1][1] > d.y){
        d.selected = true;
        return 'brushSelected';
      }
      else
        return 'users'
    })
  }

  function bEnd(){
    if(d3.event.selection != null) {
      d3.select(this).call(d3.event.target.move, null)
    }
  }

  sources = []
  targets = []
  brushed = []
  function dragStart(){
    console.log('here');
    
    sources = link.filter(function(d) {return d.source.selected})
    targets = link.filter(function(d) {return d.target.selected})
    brushed = d3.selectAll('.brushSelected')
  }

  function dragged() {
    dx = d3.event.dx;
    dy = d3.event.dy;

    brushed.attr('cx', function(d) {return d.x += dx}).attr('cy', function(d) {return d.y += dy})

    sources.attr('x1', function(d) {return d.source.x})
           .attr('y1', function(d) {return d.source.y})
           .attr('x2', function(d) {return d.target.x})
           .attr('y2', function(d) {return d.target.y})

    targets.attr('x1', function(d) {return d.source.x})
           .attr('y1', function(d) {return d.source.y})
           .attr('x2', function(d) {return d.target.x})
           .attr('y2', function(d) {return d.target.y})
  }

}


dispatch.on('userInfo', function(d){
  unselectedLines = d3.selectAll("line").attr('stroke', 'grey').attr('class', 'unselectedLine')
  selectedLineSource = d3.selectAll("line[source=\'" + d.id + "\']")
  selectedLineTarget = d3.selectAll("line[target=\'" + d.id + "\']")
  selectedLineSource.attr('class', "selectedLine").attr('stroke', color(d.group)).raise()
  selectedLineTarget.attr('class', "selectedLine").attr('stroke', color(d.group)).raise()
});

function searchUser(user){
  userNode = nodes.filter(function(d){if(d.id == user) return d})
  if(userNode[0] != undefined)
  dispatch.call('userInfo', userNode[0], userNode[0]);
}


//this function is only here because i was lazy doing the JSON file
function jsonFix() {
  var passedUsers = []
  for (n in dataset) {
    nodes.push({"id": dataset[n].node, "commonNumber": dataset[n].commonNumber, "group": dataset[n].group, "selected": false});  
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