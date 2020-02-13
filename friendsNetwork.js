var dataset;
var simulation;
var dispatch = d3.dispatch('userInfo')


var nodes = [];
var links = [];

var currentNodes
var currentLinks

var userSelected = "";

color = d3.scaleOrdinal(d3.schemeTableau10)

d3.json("instagramFriendsNetwork.json").then(function(data) {
  dataset = data;
  jsonFix();
  genViz()
});


function genViz() {
  
  
  console.log(nodes);
  console.log(currentNodes);
  console.log(links);
  console.log(currentLinks);
  

  //ignore first element beacuse it is the center piece
  var max = d3.max(dataset, function(d) {if(d != dataset[0]) return d.commonNumber})
  //5:0-15    7:16-30   10:30-45  15:46-60   18:61-76
  circleScale = d3.scaleQuantize().domain([0,max]).range([3,6,9,12,15])
  
  width = 1000
  height = 880
  
  simulation = d3.forceSimulation(nodes)
  .force('charge', d3.forceManyBody().strength(-50))
  .force('link', d3.forceLink(links).id(d => d.id).distance(120))
  .force('center', d3.forceCenter(width/2, height/2))
  .force('collide', d3.forceCollide(10))

  createWidget(max, circleScale, simulation)
  
  var svg = d3.select('#network').append('svg').attr('class', 'networkSvg').attr('width', width).attr('height', height).on('click', function(){d3.selectAll('line').attr('class', 'untouchedline').attr('stroke', 'grey')})
  
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
  
  var node = svg.append('g')
  .selectAll('circle')
  .data(nodes).join('circle')
  .attr('class', 'users')
  .attr('id', function (d) {return d.id})
  .attr('r', function (d) {if(d.id == dataset[0].node) return 20; else return circleScale(d.commonNumber)})
  .attr('fill', function(d) {return color(d.group)})
  .on('mouseover', function(d) {
    d3.select('.tooltip').remove()
    var tooltip = d3.select('body').append('div').attr('class', 'tooltip')
    tooltip.transition().duration(100)

    tooltip.html("<div class = 'tooltipContainer'>"
        + "<div class = 'profileInfo'>"
        + "<a class = 'profileName'>" + d.id + "</a>"
        + "<a class = 'realName'>" + d.name + "</a>"
        + "</div>"
        + "<a class = 'profileButton' href='https://www.instagram.com/" + d.id + "\'" + "> Profile </a>"
        + "</div>")
          .style('left', (d3.event.pageX + 15) + "px").style('top', (d3.event.pageY - 40) + "px")
  })
  .on('mouseout', function() {
    var tooltip = d3.select('.tooltip')
    tooltip.transition().duration(2000).remove()
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
  if(userSelected != d.id){
    selectedLineSource = d3.selectAll("line[source=\'" + d.id + "\']")
    selectedLineTarget = d3.selectAll("line[target=\'" + d.id + "\']")
    selectedLineSource.attr('class', "selectedLine").attr('stroke', color(d.group)).raise()
    selectedLineTarget.attr('class', "selectedLine").attr('stroke', color(d.group)).raise()
  }
  userSelected = d.id;
});

function searchUser(user){
  userNode = nodes.filter(function(d){if(d.id == user) return d})
  if(userNode[0] != undefined)
  dispatch.call('userInfo', userNode[0], userNode[0]);
}


//THIS FUNCTION WAS A LITTLE BIT HARDCODED
function createWidget(max, circleScale, simulation) {

  var sWidth = 400
  var sHeight = 80
  var maximumRadius = circleScale(max)
  var spaceOut = 15
  var translation = maximumRadius + spaceOut/2
  
  //there is 5 different circle values
  var sg = d3.select('#sizeWidget').append('svg').attr('id', 'sizeSvg').attr('width', sWidth).attr('height', sHeight).append('g')
  var descriptions = ['0-15', '16-30', '31-46', '47-61', '62-77']
  for(i=0; i<5; i++){
    var r = circleScale(i*15+2)
    circle = sg.append('circle').attr('class', 'users').attr('r', r).attr('fill', color(0)).attr('cx', sWidth*0.1+ translation + i*(spaceOut + 2*maximumRadius)).attr('cy', sHeight/3)
    .on('click', function(){
      reconfigureRadius(simulation, d3.select(this).attr('r'))
      d3.select(this).attr('fill', '#99aab5')
    })
    //couldn't find a way to center the middle of the word with the middle of the circle
    sg.append('text').attr('class', 'colorNames').attr('x',  sWidth*0.1+ translation - descriptions[i]["length"]*3 + i*(spaceOut + 2*maximumRadius)).attr('y', sHeight*3/4).text(descriptions[i])
  }
  
  //there is 6 different color values
  var cg = d3.select('#colorWidget').append('svg').attr('id', 'colorSvg').attr('width', sWidth).attr('height', sHeight).append('g')
  var descriptions = ['Me', 'CVG', 'Swim' , 'Técnico', 'Family', 'Elsewhere']
  for(i=0; i<6; i++){
    cg.append('circle').attr('class', 'users').attr('r', circleScale(max)).attr('fill', color(i)).attr('cx', sWidth*0.1 + i*(spaceOut + 2*maximumRadius)).attr('cy', sHeight/3)
    .on('click', function(){
      reconfigureColor(simulation, d3.select(this).attr('fill'))
      d3.select(this).attr('fill', '#99aab5')
    })
    cg.append('text').attr('class', 'colorNames').attr('x',7.5 +translation - descriptions[i]["length"] + i*(spaceOut + 2*maximumRadius)).attr('y', sHeight*3/4).text(descriptions[i])
  }


  //create nodes and circle description
  w = 150, h = 80 
  var svgDC = d3.select('#dotAndCircle').append('svg').attr('width', w).attr('height', h)
  svgDC.append('g').append('circle').attr('id', 'circleDescritpion').attr('r', 10).attr('cx', w/10).attr('cy', h/3).attr('fill', color(0))
  svgDC.append('text').attr('class', 'descriptionText').attr('x', w/5 + 10).attr('y', h/3 + 2).text('My Instagram Friends')
  svgDC.append('g').append('line').attr('id', 'lineDescritpion').attr('x1', w/10 - 10).attr('y1', h*2/3).attr('x2', w/10 + 10).attr('y2', h*2/3).attr('stroke','grey').style('stroke-width', 3)
  svgDC.append('text').attr('class', 'descriptionText').attr('x', w/5 + 10).attr('y', h*2/3 + 2).text('Mutual follow')
}

function reconfigureRadius(simulation, radius){
  currentNodes = currentNodes.filter(function(d) {
    if(circleScale(d.commonNumber) != radius || d.id == nodes[0].id) {return true}
    else { d3.select("circle[id=\'" + d.id+"\']").remove();}
    })
    
  currentLinks = currentLinks.filter(function(d) {
    if(circleScale(d.source.commonNumber) == radius && d.source.id != nodes[0].id) {
      d3.selectAll("line[source=\'" + d.source.id + "\']").remove()
      d3.selectAll("line[target=\'" + d.source.id + "\']").remove()
      return false
    }
    else if(circleScale(d.target.commonNumber) == radius){
      d3.selectAll("line[target=\'" + d.target.id + "\']").remove()
      return false
    }
    return true
    })
    
  simulation.force('charge', d3.forceManyBody().strength(-30))
  .force('link', d3.forceLink(currentLinks).id(d => d.id).distance(100))
  .force('center', d3.forceCenter(width/2, height/2))
  .force('collide', d3.forceCollide(10)).alphaTarget(0.2).restart();

  setTimeout(function() {simulation.stop()}, 20000)

}

function reconfigureColor(simulation, c){
  currentNodes = currentNodes.filter(function(d) {
    if(color(d.group) != c) {return true}
    else {d3.select("circle[id=\'" + d.id+"\']").remove();}
    })

  currentLinks = currentLinks.filter(function(d) {
    if(color(d.source.group) == c) {
      d3.selectAll("line[source=\'" + d.source.id + "\']").remove()
      d3.selectAll("line[target=\'" + d.source.id + "\']").remove()
      return false
    }
    else if(color(d.target.group) == c){
      d3.selectAll("line[target=\'" + d.target.id + "\']").remove()
      return false
    }
    return true
    })
    
  simulation.force('charge', d3.forceManyBody().strength(-10))
  .force('link', d3.forceLink(currentLinks).id(d => d.id).distance(100))
  .force('center', d3.forceCenter(width/2, height/2))
  .force('collide', d3.forceCollide(10)).alphaTarget(0.2).restart();

  setTimeout(function() {simulation.stop()}, 20000)
}


//this function is only here because i was lazy doing the JSON file
function jsonFix() {
  var passedUsers = []
  for (n in dataset) {
    nodes.push({"id": dataset[n].node, "name": dataset[n].name,"commonNumber": dataset[n].commonNumber, "group": dataset[n].group, "selected": false});  
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
  currentNodes = nodes
  currentLinks = links
}