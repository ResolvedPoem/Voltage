var board = document.getElementById('gameArea');
var dotHolder = document.getElementById(`dotHolder`);
var percentFull = 0.5;
var triangleLength = 220;
var totalDepth = 6;
var yIterator = 0;
var xIterator = 0;
var nodeGrid = {};
var depth = 0;
var nodeID = 0;
var nodeGraph = {};
var fullNodeGraph = {};
var rand;
var dotsAtDepth = {"0":2,"1":3,"2":4,"3":3,"4":4,"5":3,"6":2,"7":0};
var allInputs = document.getElementsByClassName('inputs');
Array.from(allInputs).forEach(function(singleInput){
  singleInput.addEventListener("keyup", function(event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
      // Focus on the next sibling
			setStrength();
    }
  });
})

window.onload = (event) => {

}

function setSeed() {
	let seedString = document.getElementById('gameSeed').value;
	var seedHash = cyrb128(seedString);
	rand = sfc32(seedHash[0], seedHash[1], seedHash[2], seedHash[3]);

	//starting code
	generateDots();
	generateLines();
	Array.from(document.querySelectorAll(`.node`)).forEach((element) => {
		let connectedLines = overlayCheck(element, `line`);
		element.connectedLines = connectedLines;
		element.addEventListener(`click`, sendSignal);
	});
	generateGoalNodes();
	document.addEventListener("mousedown", mouseClick);
}

function mouseClick(event) {
  var rightclick;
  if (!event){
    var event = window.event;
  } 
  if (event.which){
    rightclick = (event.which == 3);
  } 
  else if (event.button) {
    rightclick = (event.button == 2);
  }
  if(rightclick) {// true or false
  	resetGrid(rightclick);
  }
}

function setStrength() {
	let strength = document.getElementById('strength').value;
	resetGrid();
	Array.from(document.querySelectorAll(`.line`)).forEach((element) => {
		element.removeEventListener(`click`, toggleLine);
	});
	Array.from(document.querySelectorAll(`.node`)).forEach((element) => {
		//element.removeEventListener(`click`, rotateNode);
		element.addEventListener(`click`, sendSignal);
	});
}

function sendSignal(event) {
	//let strength = Number(document.getElementById('strength').value);
	let strength = 6;
	resetGrid();
	Array.from(document.querySelectorAll(`.line`)).forEach((element) => {
		element.removeEventListener(`click`, toggleLine);
	});
	if(strength == NaN) {
		return false;
	}
	event.target.style.backgroundColor = `#FAE01F`;
	event.target.style.border = `2px solid #7C638E`;
	if(pushSignal(event.target, strength)) {
		let touchedNodes = Array.from(document.querySelectorAll(`.completed`));
		let goalNodes = Array.from(document.querySelectorAll(`.goal`));
		if(arraysEqual(touchedNodes, goalNodes)) {
			touchedNodes.forEach((element) => {
				element.innerHTML = `✔`;
				element.style.color = `#228B22`;
			});
		} else {
			console.log(`failure`);
		}
		Array.from(document.querySelectorAll(`.line`)).forEach((element) => {
			element.addEventListener(`click`, toggleLine);
		});
		// Array.from(document.querySelectorAll(`.node`)).forEach((element) => {
		// 	element.addEventListener(`click`, rotateNode);
		// });
	}
}

function pushSignal(node, strength) {
	// if(strength == 0 && !node.visited) {
	// 	node.style.backgroundColor = `#FAE01F`;
	// 	node.style.border = `2px solid #7C638E`;
	// 	const myTimeout = setTimeout(pushSignal, 500, node, originalStrength-1, originalStrength-1);
	// }
	// node.visited = true;
	// let connectedLines = Array.from(node.connectedLines);
	if(strength > 0) {
		let allShortestPaths = shortestPath(nodeGraph, node.id);
		let chosenGoal = [node.id, Infinity];
		Array.from(document.querySelectorAll(`.goal`)).forEach((element) => {
			if (!element.classList.contains(`completed`)) {
				if(allShortestPaths[element.id] < chosenGoal[1]) {
					chosenGoal[0] = element.id;
					chosenGoal[1] = allShortestPaths[element.id];
				}
			}
		});
		let pathToGoal = findShortestPath(nodeGraph, node.id, chosenGoal[0]);
		let hitGoal = document.getElementById(`${chosenGoal[0]}`);
		if (strength == pathToGoal.path.length - 1) {
			hitGoal.style.backgroundColor = `#FAE01F`;
			for(let i = 0; i < pathToGoal.path.length-1; i++) {
				let lineIDArray = [pathToGoal.path[i], pathToGoal.path[i+1]];
				lineIDArray = lineIDArray.sort(function (a, b) {  return a - b;  });
				let lineID = `${lineIDArray[0]},${lineIDArray[1]}`;
				let line = document.getElementById(`${lineID}`);
				line.style.backgroundColor = `#FAE01F`;
				line.style.border = `2px solid #7C638E`;
			}
			hitGoal.classList.add(`completed`);
			pushSignal(hitGoal, strength - 1);
		}
		else if (strength < pathToGoal.path.length) {
			let wrongNode;
			for(let i = 0; i < strength; i++) {
				let lineIDArray = [pathToGoal.path[i], pathToGoal.path[i+1]];
				lineIDArray = lineIDArray.sort(function (a, b) {  return a - b;  });
				let lineID = `${lineIDArray[0]},${lineIDArray[1]}`;
				let line = document.getElementById(`${lineID}`);
				line.style.backgroundColor = `#FAE01F`;
				line.style.border = `2px solid #7C638E`;
				wrongNode = document.getElementById(`${pathToGoal.path[i+1]}`);
			} 
			wrongNode.style.boxShadow = `0 0 20px #E0403C`;
			wrongNode.style.border = `2px solid #E0403C`;
		}
		else {
			for(let i = 0; i < pathToGoal.path.length-1; i++) {
				let lineIDArray = [pathToGoal.path[i], pathToGoal.path[i+1]];
				lineIDArray = lineIDArray.sort(function (a, b) {  return a - b;  });
				let lineID = `${lineIDArray[0]},${lineIDArray[1]}`;
				let line = document.getElementById(`${lineID}`);
				line.style.backgroundColor = `#FAE01F`;
				line.style.border = `2px solid #7C638E`;
			} 
			hitGoal.style.boxShadow = `0 0 20px #E0403C`;
			hitGoal.style.border = `2px solid #E0403C`;
		}
	}
	return true;
}

function resetGrid(rightclick) {
	Array.from(document.querySelectorAll(`.node`)).forEach((element) => {
		// element.removeEventListener(`click`, sendSignal);
		element.visited = false;
		element.style.backgroundColor = `#7C638E`;
		element.style.border = `2px solid #f5f5f5`;
		element.style.boxShadow = ``;
	});
	Array.from(document.querySelectorAll(`.line`)).forEach((element) => {
		element.style.backgroundColor = `#424D59`;
		element.style.border = ``;
	});
	Array.from(document.querySelectorAll(`.goal`)).forEach((element) => {
		element.style.boxShadow = `0 0 20px #0078AB`;
		element.style.border = `2px solid #0078AB`;
		element.classList.remove(`completed`);
	});	
	if(rightclick) {
		Array.from(document.querySelectorAll(`.line`)).forEach((element) => {
			element.style.opacity = `0.1`;
			let adjacentNodes = overlayCheck(element, `node`);
			nodeGraph[adjacentNodes[0].id][adjacentNodes[1].id] = Infinity;
			nodeGraph[adjacentNodes[1].id][adjacentNodes[0].id] = Infinity;
		});		
	}
}

function shortestPath(graph, start) {
    // Create an object to store the shortest distance from the start node to every other node
    let distances = {};

    // A set to keep track of all visited nodes
    let visited = new Set();

    // Get all the nodes of the graph
    let nodes = Object.keys(graph);

    // Initially, set the shortest distance to every node as Infinity
    for (let node of nodes) {
        distances[node] = Infinity;
    }
    
    // The distance from the start node to itself is 0
    distances[start] = 0;

    // Loop until all nodes are visited
    while (nodes.length) {
        // Sort nodes by distance and pick the closest unvisited node
        nodes.sort((a, b) => distances[a] - distances[b]);
        let closestNode = nodes.shift();

        // If the shortest distance to the closest node is still Infinity, then remaining nodes are unreachable and we can break
        if (distances[closestNode] === Infinity) break;

        // Mark the chosen node as visited
        visited.add(closestNode);

        // For each neighboring node of the current node
        for (let neighbor in graph[closestNode]) {
            // If the neighbor hasn't been visited yet
            if (!visited.has(neighbor)) {
                // Calculate tentative distance to the neighboring node
                let newDistance = distances[closestNode] + graph[closestNode][neighbor];
                
                // If the newly calculated distance is shorter than the previously known distance to this neighbor
                if (newDistance < distances[neighbor]) {
                    // Update the shortest distance to this neighbor
                    distances[neighbor] = newDistance;
                }
            }
        }
    }

    // Return the shortest distance from the start node to all nodes
    return distances;
}

let shortestDistanceNode = (distances, visited) => {
  // create a default value for shortest
	let shortest = null;
	
  	// for each node in the distances object
	for (let node in distances) {
    	// if no node has been assigned to shortest yet
  		// or if the current node's distance is smaller than the current shortest
		let currentIsShortest =
			shortest === null || distances[node] < distances[shortest];
        	
	  	// and if the current node is in the unvisited set
		if (currentIsShortest && !visited.includes(node)) {
            // update shortest to be the current node
			shortest = node;
		}
	}
	return shortest;
};

let findShortestPath = (graph, startNode, endNode) => {
 
 // track distances from the start node using a hash object
   let distances = {};
 distances[endNode] = "Infinity";
 distances = Object.assign(distances, graph[startNode]);// track paths using a hash object
 let parents = { endNode: null };
 for (let child in graph[startNode]) {
  parents[child] = startNode;
 }
  
 // collect visited nodes
   let visited = [];// find the nearest node
   let node = shortestDistanceNode(distances, visited);
 
 // for that node:
 while (node) {
 // find its distance from the start node & its child nodes
  let distance = distances[node];
  let children = graph[node]; 
      
 // for each of those child nodes:
      for (let child in children) {
  
  // make sure each child node is not the start node
        if (String(child) === String(startNode)) {
          continue;
       } else {
          // save the distance from the start node to the child node
          let newdistance = distance + children[child];// if there's no recorded distance from the start node to the child node in the distances object
// or if the recorded distance is shorter than the previously stored distance from the start node to the child node
          if (!distances[child] || distances[child] > newdistance) {
// save the distance to the object
     distances[child] = newdistance;
// record the path
     parents[child] = node;
    } 
         }
       }  
      // move the current node to the visited set
      visited.push(node);// move to the nearest neighbor node
      node = shortestDistanceNode(distances, visited);
    }
  
 // using the stored paths from start node to end node
 // record the shortest path
 let shortestPath = [endNode];
 let parent = parents[endNode];
 while (parent) {
  shortestPath.push(parent);
  parent = parents[parent];
 }
 shortestPath.reverse();
  
 //this is the shortest path
 let results = {
  distance: distances[endNode],
  path: shortestPath,
 };
 // return the shortest path & the end node's distance from the start node
   return results;
};

function rotateNode(event) {
	let connectedLines = Array.from(event.target.connectedLines);
	let yoinkedLine = connectedLines.pop();
	connectedLines.splice(2, 0, yoinkedLine);
	let lastLineStyle = null;
	let firstLine = null;
	for (const line of connectedLines) {
		if (!lastLineStyle) {
			firstLine = line;
		}
		let tempStyle = line.style.visibility;
		line.style.visibility = lastLineStyle;
		lastLineStyle = tempStyle;
		let adjacentNodes = overlayCheck(line, `node`);
		if(line.style.visibility != `hidden`) {
			nodeGraph[adjacentNodes[0].id][adjacentNodes[1].id] = 1;
			nodeGraph[adjacentNodes[1].id][adjacentNodes[0].id] = 1;
		} else {
			nodeGraph[adjacentNodes[0].id][adjacentNodes[1].id] = Infinity;
			nodeGraph[adjacentNodes[1].id][adjacentNodes[0].id] = Infinity;
		}
	}
	firstLine.style.visibility = lastLineStyle;
	let adjacentNodes = overlayCheck(firstLine, `node`);
	if(firstLine.style.visibility != `hidden`) {
		nodeGraph[adjacentNodes[0].id][adjacentNodes[1].id] = 1;
		nodeGraph[adjacentNodes[1].id][adjacentNodes[0].id] = 1;
	} else {
		nodeGraph[adjacentNodes[0].id][adjacentNodes[1].id] = Infinity;
		nodeGraph[adjacentNodes[1].id][adjacentNodes[0].id] = Infinity;
	}
}

function toggleLine(event) {
	let line = event.target;
	let adjacentNodes = overlayCheck(line, `node`);
	if(line.style.opacity == `1`) {
		line.style.opacity = `0.1`;
		nodeGraph[adjacentNodes[0].id][adjacentNodes[1].id] = Infinity;
		nodeGraph[adjacentNodes[1].id][adjacentNodes[0].id] = Infinity;		
	} else {
		line.style.opacity = `1`;
		nodeGraph[adjacentNodes[0].id][adjacentNodes[1].id] = 1;
		nodeGraph[adjacentNodes[1].id][adjacentNodes[0].id] = 1;			
	}
}

function generateGoalNodes(){
	let min = 3;
	let max = 5;
	let randomStrength = Math.floor(rand() * (max - min + 1) + min);
	randomStrength = 6;
	let keys = Object.keys(fullNodeGraph);
	let startingNode = keys[Math.floor(keys.length * rand())];
	let allDistances = shortestPath(fullNodeGraph, startingNode);
	let goalNodeIDs = [startingNode];
	for (i = 1; i < randomStrength; i++) {
		var filtered = Object.keys(allDistances).reduce(function (filtered, key) {
		    if (allDistances[key] <= i && allDistances[key] != 0 && !goalNodeIDs.includes(key)) {
		    	filtered[key] = allDistances[key];
		    } 
		    return filtered;
		}, {});
		let nextNode = Object.keys(filtered)[Math.floor(Object.keys(filtered).length * rand())];
		goalNodeIDs.push(nextNode);
	}
	for (let nodeID of goalNodeIDs) {
		let node = document.getElementById(`${nodeID}`);
		node.style.boxShadow = `0 0 20px #0078AB`;
		node.style.border = `2px solid #0078AB`;
		node.classList.add(`goal`);		
	}	
	// let allNodes = Array.from(document.querySelectorAll(`.node`));
	// let someNodes = allNodes;
	// let goalNodeCount = 3;
	// for (var i = 0; i < goalNodeCount; i++) {
	// 	const randomNode = someNodes[Math.floor(Math.random() * someNodes.length)];
	// 	someNodes = someNodes.filter((value, index) => value != randomNode);
	// 	randomNode.style.boxShadow = `0 0 20px #0078AB`;
	// 	randomNode.style.border = `2px solid #0078AB`;
	// 	randomNode.classList.add(`goal`);
	// }
}

function getNextRight(x1, y1) {
  hyp = triangleLength, // hypotenuse
  theta_deg = 30, // theta angle in degrees
  rad = (parseFloat(theta_deg) * Math.PI) / 180, // convert deg to radians
  
  // opp = hyp * sin(θ)
  opp = Math.round((hyp * Math.sin(rad)) * 100) / 100, // opposite side
  
  // adj = √( (hyp * hyp) - (opp * opp) )
  adj = Math.round((Math.sqrt((hyp * hyp) - (opp * opp))) * 100) / 100, // adjacent side
  x2 = x1 + adj, y2 = y1 + opp; // end point

  return [x2, y2, adj, hyp];

}

function createNode(){
	var node = document.createElement(`div`);
	node.classList.add(`node`);
	node.id = nodeID;
	//DEBUG CODE
		node.innerHTML = `${node.id}`;
	//END DEBUG
	nodeID++;
	dotHolder.appendChild(node);
	//node.addEventListener(`click`, rotateNode);
	return node;
}

function generateDots(startNode) {
	if(!startNode) {
		startNode = createNode();
		let triangleInfo = getNextRight(0,0);
		let offsetLeft = window.innerWidth / 2 - startNode.clientWidth/2;
		if(dotsAtDepth[0] % 2 == 0) {
			//even
			offsetLeft += triangleInfo[2] + (triangleInfo[2] * 2) * (Math.floor(dotsAtDepth[0]/2) - 1);
		} else {
			offsetLeft += (triangleInfo[2] * 2) * (Math.floor(dotsAtDepth[0]/2));
		}
		startNode.style.top = `50px`;
		startNode.style.left = offsetLeft + `px`;
		let startNodeCenter = [Math.round(startNode.offsetLeft + startNode.clientWidth / 2), Math.round(startNode.offsetTop + startNode.clientHeight / 2)];
		for(let i = 1; i < dotsAtDepth[depth]; i++) {
			let left = [Math.round(startNodeCenter[1] - startNode.clientWidth / 2), Math.round(startNodeCenter[0] - startNode.clientWidth / 2  - 2 * triangleInfo[2] * (i))];
			nodeGrid[[left[1] + startNode.clientWidth / 2,left[0] + startNode.clientWidth / 2]] = [`a`];
			var leftNode = createNode();
			leftNode.style.top = left[0] + `px`;
			leftNode.style.left = left[1] + `px`;
		}
		depth++;
	}
	if (depth <= totalDepth) {
		let startNodeCenter = [Math.round(startNode.offsetLeft + startNode.clientWidth / 2), Math.round(startNode.offsetTop + startNode.clientHeight / 2)];
		let nextNodeCoords = getNextRight(startNodeCenter[0],startNodeCenter[1]);
		let rightNodeCoords = [Math.round(nextNodeCoords[0] - startNode.clientWidth / 2), Math.round(nextNodeCoords[1] - startNode.clientHeight / 2)];
		let depthAdjuster = 0;
		nodeGrid[startNodeCenter] = [];

		if(!(dotsAtDepth[depth] <= dotsAtDepth[depth-1])) {
			var rightNode = createNode();
			rightNode.style.top = rightNodeCoords[1] + `px`;
			rightNode.style.left = rightNodeCoords[0] + `px`;
			dotsAtDepth[depth]--;
			depthAdjuster++;
		}
		let lastNode = null;
		for(let i = 1; i <= dotsAtDepth[depth]; i++) {
			let left = [Math.round(nextNodeCoords[1] - startNode.clientWidth / 2), Math.round(Number(nextNodeCoords[0]) - startNode.clientWidth / 2  - 2 * nextNodeCoords[2] * (i))];
			nodeGrid[[left[1] + startNode.clientWidth / 2,left[0] + startNode.clientWidth / 2]] = [`a`];
			var leftNode = createNode();
			leftNode.style.top = left[0] + `px`;
			leftNode.style.left = left[1] + `px`;
			if((dotsAtDepth[depth]+depthAdjuster <= dotsAtDepth[depth-1]) && i == dotsAtDepth[depth]) {
				rightNode = lastNode;
			}
			if((dotsAtDepth[depth]+depthAdjuster <= dotsAtDepth[depth-1]) && i == 1) {
				lastNode = leftNode;		
			}
		}
		depth++;
		generateDots(rightNode);
	}
}

function generateLines() {
	let lineID = 0;
	for (const property in nodeGrid) {
		let propertyArray = property.split(",");
		for(let i = -1; i <= 1; i ++) {
			const line = document.createElement(`div`);
			line.classList.add(`line`);
			dotHolder.appendChild(line);
			line.id = lineID;
			lineID++;
			line.style.height = triangleLength + `px`;
			line.style.width = triangleLength / 20 + `px`;
			line.style.top = `${propertyArray[1]}px`;
			line.style.left = `${(propertyArray[0])}px`;
			line.style.transform = `rotate(${(i)*60}deg)`;
			line.style.backgroundColor = `#424D59`;
			line.style.opacity = `0.1`;
			line.addEventListener(`click`, toggleLine);
			let adjacentNodes = overlayCheck(line, `node`);
			if(adjacentNodes.length != 2) {
				line.remove();
			} else {
				let lineIDArray = [adjacentNodes[0].id, adjacentNodes[1].id];
				lineIDArray = lineIDArray.sort(function (a, b) {  return a - b;  });
				line.id = `${lineIDArray[0]},${lineIDArray[1]}`;
				if(!nodeGraph[adjacentNodes[0].id]) {
					nodeGraph[adjacentNodes[0].id] = {};
				}
				if(!nodeGraph[adjacentNodes[1].id]) {
					nodeGraph[adjacentNodes[1].id] = {};
				}
				nodeGraph[adjacentNodes[0].id][adjacentNodes[1].id] = Infinity;
				nodeGraph[adjacentNodes[1].id][adjacentNodes[0].id] = Infinity;
				if(!fullNodeGraph[adjacentNodes[0].id]) {
					fullNodeGraph[adjacentNodes[0].id] = {};
				}
				if(!fullNodeGraph[adjacentNodes[1].id]) {
					fullNodeGraph[adjacentNodes[1].id] = {};
				}
				fullNodeGraph[adjacentNodes[0].id][adjacentNodes[1].id] = 1;
				fullNodeGraph[adjacentNodes[1].id][adjacentNodes[0].id] = 1;
				//let randomBoolean = Math.random() > percentFull;
				// if (randomBoolean) {
				// 	//line.style.visibility = `hidden`;
				// 	nodeGraph[adjacentNodes[0].id][adjacentNodes[1].id] = Infinity;
				// 	nodeGraph[adjacentNodes[1].id][adjacentNodes[0].id] = Infinity;
				// } else {
				// 	line.style.opacity = `1`;
				// 	//line.style.visibility = `visible`;
				// 	nodeGraph[adjacentNodes[0].id][adjacentNodes[1].id] = 1;
				// 	nodeGraph[adjacentNodes[1].id][adjacentNodes[0].id] = 1;
				// }
			}
		}
	}
}

// function realRotate(event) {
// 	let connectedLines = Array.from(event.target.connectedLines);
// 	console.log(connectedLines);
// 	for (const line of connectedLines) {
// 		if(!line.rotationID) {
// 			line.rotationID = setInterval(letThereBeLight, 10, [line, event.target]);			
// 		}
// 	}
// }

// function letThereBeLight(arrayInput) {
// 	let div = arrayInput[0];
// 	let node = arrayInput[1];
// 	let currentRotation = Number(div.style.transform.replace("rotate(","").replace("deg)",""))
// 	if(!div.rotation) {
// 		div.rotation = currentRotation;
// 	}
// 	if(currentRotation != div.rotation + 60) {
// 		div.style.transformOrigin = `50% 0%`;
// 		div.style.transform = `rotate(${currentRotation + 5}deg)`;
// 	} else {
// 		clearInterval(div.rotationID);
// 	  div.rotationID = false;
// 	  div.rotation = false;
// 	}
// }

// function generateTriangles() {
// 	for (const property in nodeGrid) {
// 		let propertyArray = property.split(",");
// 		for(let i = -1; i <= 1; i += 2) {
// 				const triangle = document.createElement(`div`);
// 				triangle.classList.add(`triangle`);
// 				dotHolder.appendChild(triangle);
// 				triangle.id = triangleID;
// 				triangleID++;
// 				triangle.style.top = `${propertyArray[1]}px`;
// 				triangle.style.left = `${(propertyArray[0] - triangleLength/2)}px`;
// 				triangle.style.transform = `rotate(${(i)*30}deg)`;
// 				triangle.style.backgroundColor = `#424D59`;
// 				if(overlayCheck(triangle, `node`).length != 3) {
// 					triangle.remove();
// 				}
// 		}
// 	}
// 	let allTriangles = Array.from(document.querySelectorAll(`.triangle`));
// 	let redCount = 0;
// 	let blueCount = 0;
// 	let purpleCount = allTriangles.length - redCount - blueCount;
// 	const colors = {
// 	  '#80D0D9': redCount,
// 	  '#F04A4C': blueCount,
// 	  '#6D6BDA': purpleCount
// 	}
// 	let triangleColors = [];
// 	for (const [key, count] of Object.entries(colors)) {
// 	    const start = triangleColors.length;
// 	    triangleColors.length += count;
// 	    triangleColors.fill(key, start, triangleColors.length);
// 	}
// 	shuffle(triangleColors);
// 	for (const triangleDiv of allTriangles) {
// 		triangleDiv.style.backgroundColor = triangleColors[triangleDiv.id];
// 	}
// }

function randomColor() {
	let n = (Math.random() * 0xfffff * 1000000).toString(16);
	return '#' + n.slice(0, 6);
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  a.sort();
  b.sort();

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function shuffle(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(rand() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}

function overlayCheck(div, tagToCheck) {
  let points = Array.from(document.querySelectorAll(`.${tagToCheck}`));
  points.sort((a, b) => {
  	let topfirst = a.style.top.replace("px","") - b.style.top.replace("px","");
  	let leftfirst = a.style.left.replace("px","") - b.style.left.replace("px","");
  	return leftfirst;
  });

  let allOverlaps = [];

  let rightPos = (elem) => elem.getBoundingClientRect().right;
  let leftPos = (elem) => elem.getBoundingClientRect().left;
  let topPos = (elem) => elem.getBoundingClientRect().top;
  let btmPos = (elem) => elem.getBoundingClientRect().bottom;

	for (let i = 0; i < points.length; i++) {
	  let isOverlapping = !(
		rightPos(div) < leftPos(points[i]) ||
		leftPos(div) > rightPos(points[i]) ||
		btmPos(div) < topPos(points[i]) ||
		topPos(div) > btmPos(points[i])
	  );

	  if (isOverlapping) {
			allOverlaps.push(points[i]);
	  }
	}
	return allOverlaps;
}

//randomization code YOINKED

function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
    return [h1>>>0, h2>>>0, h3>>>0, h4>>>0];
}

function sfc32(a, b, c, d) {
    return function() {
      a |= 0; b |= 0; c |= 0; d |= 0; 
      var t = (a + b | 0) + d | 0;
      d = d + 1 | 0;
      a = b ^ b >>> 9;
      b = c + (c << 3) | 0;
      c = (c << 21 | c >>> 11);
      c = c + t | 0;
      return (t >>> 0) / 4294967296;
    }
}

//end randomization code YOINKED