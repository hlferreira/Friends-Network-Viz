var dataset;

d3.json("instagramFriendsNetwork.json", function(error, data) {
  if (error) throw error;
  dataset = data;
});