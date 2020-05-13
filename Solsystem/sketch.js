let lastMouseX, lastMouseY;

let cameraDistanceMax, cameraDistanceMin, cameraDistance;
cameraDistanceMax = 10000000;
cameraDistanceMin = 5;

cameraDistance = 100000;
let cameraAngleX, cameraAngleY;
cameraAngleX = 0;
cameraAngleY = 90;


let cameraAngleSensitivity = 0.2;
let cameraZoomStep;
let cameraZoomSensitivity = 0.001;

let cameraX, cameraY, cameraZ;

let bodies, bodyNameElements;
bodies = bodyNameElements = [];

let AU = 149597870700;
let ORBITAL_PERIODS = [0, 0.2408, 0.6152, 1, 1.8809, 11.862, 29.458, 84.01, 164.79, 248.54];


let simScale = 5000;
let radiusScale = 10;

let trailSteps;
trailSteps = 50;

let font; 

function preload() {
    bodies = getBodies(getMovements(), window.lagrange.planet_info);
    font = loadFont('./assets/ARIAL.TTF');

    console.log(bodies);
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    addScreenPositionFunction();

    perspective(PI/3.0, width/height, 100, 10000000000);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);   
    perspective(PI/3.0, width/height, 100, 10000000000);
}

function draw() {
    background(0);

    push();
    stroke(color(255,0,0));
    beginShape();
    vertex(0,0,0);
    vertex(1000,0,0);
    endShape();

    stroke(color(0,255,0));
    beginShape();
    vertex(0,0,0);
    vertex(0,1000,0);
    endShape();

    stroke(color(0,0,255));
    beginShape();
    vertex(0,0,0);
    vertex(0,0,1000);
    endShape();
    pop();

    setCameraPos();

    drawBodies();
}

function drawBodies () {
    for(var i = 0; i < bodies.length; i++) {
        var scale = AU * simScale;

        var bodyPos = bodies[i].positions[0];
        var bodyRad = bodies[i].radius/AU*simScale*radiusScale;

        angleMode(RADIANS);

        drawBodyTrail(i);

        push();        
        normalMaterial();
        // console.log("pos: " + bodies[i].position);
        translate(bodyPos);
        sphere(bodyRad);
        pop();

        var screenPos = screenPosition(bodyPos);
        var distToCamera = bodyPos.dist(createVector(cameraX, cameraY, cameraZ)); 

        var bodyIndex = bodyNameElements.findIndex(b => b.name == bodies[i].name);

        if (bodyIndex == -1) {
            var bodyNameElement = createElement('h1', bodies[i].name);
            bodyNameElement.position(windowWidth/2 + screenPos.x, windowHeight/2 + screenPos.y);
            bodyNameElements.push({name: bodies[i].name, element: bodyNameElement, distance: distToCamera});
        } else {
            bodyNameElements[bodyIndex].element.position(windowWidth/2 + screenPos.x, windowHeight/2 + screenPos.y);
            bodyNameElements[bodyIndex].distance = distToCamera;
        }
    }

    bodyNameElements.sort((a,b) => b.distance - a.distance);

    for(var i = 0; i < bodyNameElements.length; i++) {
        bodyNameElements[i].element.style("z-index", i);
    }
}

function drawBodyTrail(i) {
    var positions = bodies[i].positions;

    noFill();
    stroke(255);
    strokeWeight(1.5);
    beginShape();

    vertex(positions[0].x , positions[0].y, positions[0].z);

    for (var j = 0; j < positions.length; j++) {
        vertex(positions[j].x, positions[j].y, positions[j].z);
    }

    // End at the start 
    vertex(positions[0].x , positions[0].y, positions[0].z);
    vertex(positions[0].x , positions[0].y, positions[0].z);

    endShape();
}


function mousePressed() {
    lastMouseX = mouseX;
    lastMouseY = mouseY;
}

function mouseDragged() {
    dragX = lastMouseX - mouseX;
    dragY = lastMouseY - mouseY;

    cameraAngleX -= dragX * cameraAngleSensitivity;
    cameraAngleY = constrain(cameraAngleY - dragY * cameraAngleSensitivity, 1, 179);

    lastMouseX = mouseX;
    lastMouseY = mouseY;

    // console.log("cameraAngleVector: " + cameraAngleX + ", " + cameraAngleY);
}

function mouseWheel(event) {
    cameraZoomStep = cameraDistance * cameraZoomSensitivity;
    cameraDistance = constrain(cameraDistance + event.delta * cameraZoomStep, cameraDistanceMin, cameraDistanceMax)
}

function setCameraPos() {
    angleMode(DEGREES);
    cameraX = cameraDistance * sin(cameraAngleY) * cos(cameraAngleX);
    cameraZ = cameraDistance * sin(cameraAngleY) * sin(cameraAngleX);
    cameraY = cameraDistance * cos(cameraAngleY);

    // console.log(cameraX + ", " + cameraY + ", " + cameraZ);

    camera(cameraX, cameraY, cameraZ, 0, 0, 0, 0, 1, 0);
}

function getMovements() {
    var movements = [];
    
    while (movements.length < ORBITAL_PERIODS.length) {
        movements.push({positions: [], velocities: []});
    }

    for(var i = 0; i < movements.length; i++) {
        var trailStepTime = ORBITAL_PERIODS[i]/trailSteps * 365 * 24 * 60 * 60 * 1000;
        
        for(var j = 0; j < trailSteps; j++) {
            var m = window.lagrange.planet_positions.getPositions(Date.now() - j * trailStepTime, true);

            movements[i].positions[j] = p5.Vector.div(createVector(m[i].position.y, -m[i].position.z, m[i].position.x), AU).mult(simScale);
            movements[i].velocities[j] = p5.Vector.div(createVector(m[i].velocity.y, -m[i].velocity.z, m[i].velocity.x), AU).mult(simScale);
        }
    }

    return movements;
}

function getBodies (movements, info) {
    var bodies = [];
    
    for(var i = 0; i < movements.length; i++) {
        bodies.push(new Body(movements[i], info[i]));
    }

    return bodies;
}

class Body {
    constructor (movement, info) {
        this.name = info.title;

        this.positions = movement.positions; // m
        this.velocities = movement.velocities; // m/s

        this.mass = info.mass; // kg
        this.radius = info.radius * 1000 // 
    }
}





