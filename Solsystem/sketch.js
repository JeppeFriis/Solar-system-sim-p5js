
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

let bodyToCameraDist = [];

let AU = 149597870700;

let simScale = 5000;
let radiusScale = 10;

let trailStepTime, trailSteps;
trailStepTime = 50 * 60 * 60 * 1000;
trailSteps = 20;

let font; 

function preload() {
    bodies = getBodies(getMovements(), window.lagrange.planet_info);
    font = loadFont('./assets/ARIAL.TTF');
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    addScreenPositionFunction();

    perspective(PI/3.0, width/height, 100, 10000000000);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    
}

function draw() {
    background(10,10,10);

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

        // drawBodyTrail(i);

        push();        
        normalMaterial();
        // console.log("pos: " + bodies[i].position);
        translate(bodyPos);
        sphere(bodyRad);
        pop();

        var screenPos = screenPosition(bodyPos);
        var distToCamera = bodyPos.dist(createVector(cameraX, cameraY, cameraZ)); 

        if (bodyNameElements.length < bodies.length) {
            bodyNameElements.push(createElement('h1', bodies[i].name));
            bodyToCameraDist.push({element: bodyNameElements[i], distance: distToCamera});
            bodyNameElements[i].center();
        }

        bodyNameElements[i].position(windowWidth/2 + screenPos.x, windowHeight/2 + screenPos.y);
    }

    bodyToCameraDist.sort((a,b) => b.distance - a.distance);

    // VIRKER IKKE
    for(var i = 0; i < bodyToCameraDist.length; i++) {
        bodyToCameraDist[i].element.style("z-index: " + i);
    }
}

function drawBodyTrail(i) {
    var positions = bodies[i].positions;

    fill(0,0,0,0);
    stroke(255);
    beginShape();
    for (const p of positions) {
        curveVertex(p.x, p.y, p.z);
    }
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
    
    while (movements.length < 12) {
        movements.push({positions: [], velocities: []});
    }

    for(var i = 0; i < trailSteps; i++) {
        var m = window.lagrange.planet_positions.getPositions(Date.now() - i * trailStepTime, true);
        
        for(var j = 0; j < m.length; j++) {
            movements[j].positions[i] = p5.Vector.div(createVector(m[j].position.y, m[j].position.z, m[j].position.x), AU).mult(simScale);
            movements[j].velocities[i] = p5.Vector.div(createVector(m[j].velocity.y, m[j].velocity.z, m[j].velocity.x), AU).mult(simScale);
        }
    }

    console.log(movements);

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
        this.radius = info.radius * 1000 // m
    }
}
