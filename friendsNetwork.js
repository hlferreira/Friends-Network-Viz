var dataset;
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
  scale = d3.scaleQuantize().domain([0,max]).range([3,5,7,10])

  var i = 0;
  simulation = d3.forceSimulation(nodes)
  .force('charge', d3.forceManyBody().strength(-70))
  .force('link', d3.forceLink(links).id(d => d.id).distance(200))
  .force('center', d3.forceCenter(width/2, height/2))
  .force('collide', d3.forceCollide(5))

  var svg = d3.select('#network').append('svg').attr('width', width).attr('height', height)

  var link = svg.append('g').attr("stroke", "#999")
                .attr("stroke-opacity", 0.6)
                .selectAll('line')
                .data(links).join('line')
                  .attr('class', 'links')
                  .attr('fill', 'grey')
                  .attr('stroke-width', 1)

  var node = svg.append('g')
              .selectAll('circle')
              .data(nodes).join('circle')
              .attr('class', 'users')
              .attr('id', function (d) {return 'user' + d.id})
              .attr('r', function (d) {if(d.id == 'hlferreira27') return 10; else return scale(d.commonNumber)})
              .attr('fill', 'red')
              .attr('stroke', 'white')
              .on('mouseover', function(d) {
                selectedUser = d3.select("circle[id = \'user" + d.id + "\'")
                selectedUser.append("title").text('User: ' + d.id)
                console.log(d.id)
              })


  simulation.on('tick', function (d) {
    link.attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

    node.attr('cx', d => d.x).attr('cy', d => d.y)
  });
}

function jsonFix() {
  var passedUsers = []
  for (n in dataset) {
    nodes.push({"id": dataset[n].node, "commonNumber": dataset[n].commonNumber});
    for (i in dataset[n].followers) {

      var user = dataset[n].followers[i]
      if(passedUsers.indexOf(user) == -1) 
        links.push({"source":  dataset[n].node, "target":  dataset[n].followers[i] });   
    }
    passedUsers.push(dataset[n].node)
  }
}
