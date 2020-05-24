let lastMouseX, lastMouseY;

let cameraDistanceMax, cameraDistanceMin, cameraDistance;
cameraDistanceMax = 10000000;
cameraDistanceMin = 500;

cameraDistance = 100000;
let cameraAngleX, cameraAngleY;
cameraAngleX = 0;
cameraAngleY = 90;


let cameraAngleSensitivity = 0.2;
let cameraZoomStep;
let cameraZoomSensitivity = 0.001;

let cameraX, cameraY, cameraZ;

let bodies, bodyMenus; // p5.Elements
bodies = bodyMenus = [];

let selectedBodyMenu = null; // p5.Element

let playPause;

let drag = false;

// Explanation for why I use p5.Elements instead of pure a HTML element:
// p5.Element has the position function, which I find easier to use than "top: / left:" etc.

let BODY_DATA = [
    {name: "The Sun",   orbital_period: 0,      color: "#ffa502"}, 
    {name: "Mercury",   orbital_period: 0.2408, color: "#dfe4ea"}, 
    {name: "Venus",     orbital_period: 0.6152, color: "#eccc68"},
    {name: "The Earth", orbital_period: 1,      color: "#1e90ff"},
    {name: "Mars",      orbital_period: 1.8809, color: "#ff7f50"},
    {name: "Jupiter",   orbital_period: 11.862, color: "#f1f2f6"},
    {name: "Saturn",    orbital_period: 29.458, color: "#edca5a"},
    {name: "Uranus",    orbital_period: 84.01,  color: "#70a1ff"},
    {name: "Neptune",   orbital_period: 164.79, color: "#3742fa"},
    {name: "Pluto",     orbital_period: 248.54, color: "#ff4757"}
];

let AU = 149597870700;
let G = 6.674e-11;

let simScale = 5000;
let radiusScale = 10;

let trailSteps;
trailSteps = 1000;

let lastSteps = [];

let timeScale = 1;

let font; 

let paused = true;

function preload() {
    bodies = getBodies(getMovements(), window.lagrange.planet_info);
    font = loadFont('./assets/ARIAL.TTF');

    console.log(bodies);
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);

    select('canvas').elt.addEventListener('mousedown', backgroundMouseDown);
    select('canvas').elt.addEventListener('mouseup', backgroundMouseUp);

    addScreenPositionFunction();

    setTimeScale(1000000);

    setbodyMenus();

    playPause = select("#playPause").elt;
    playPause.addEventListener('mousedown', setPlayPause);

    select("#timeScaleRange").elt.addEventListener("change", timeScaleRangeChange);

    perspective(PI/3.0, width/height, 10, 10000000000);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);   
    perspective(PI/3.0, width/height, 10, 10000000000);
}

function draw() {
    background(0);

    if (!paused && !selectedBodyMenu) setPositions();

    setCameraPos();

    drawBodies();
}

function drawBodies () {
    for(var i = 0; i < bodies.length; i++) {
        var scale = AU * simScale;

        var bodyPos = bodies[i].positionsScaled[0];
        var bodyRad = bodies[i].radius/AU*simScale*radiusScale;

        angleMode(RADIANS);

        drawBodyTrail(i);

        push();        
        fill(color(BODY_DATA[i].color));
        // console.log("pos: " + bodies[i].position);
        translate(bodyPos);
        sphere(bodyRad);
        pop();

        var screenPos = getScreenPosition(bodyPos);

        var distToCamera = bodyPos.dist(createVector(cameraX, cameraY, cameraZ)); 

        var bodyIndex = bodyMenus.findIndex(b => b.name == bodies[i].name);
        
        if (bodyIndex != -1) {
            bodyMenus[bodyIndex].element.position(windowWidth/2 + screenPos.x, windowHeight/2 + screenPos.y);
            bodyMenus[bodyIndex].distance = distToCamera;
        }
    }

    bodyMenus.sort((a,b) => b.distance - a.distance);

    for(var i = 0; i < bodyMenus.length; i++) {
        bodyMenus[i].element.style("z-index", i);
    }
}

function drawBodyTrail(bodyIndex) {
    shiftPositions(bodyIndex);

    var positions = bodies[bodyIndex].positionsScaled;

    noFill();
    stroke(color(BODY_DATA[bodyIndex].color));
    beginShape();

    vertex(positions[0].x , positions[0].y, positions[0].z);

    for (var j = 0; j < positions.length; j++) {
        vertex(positions[j].x, positions[j].y, positions[j].z);
    }

    endShape();
}

function setbodyMenus() {
    for (const b of bodies) {
        var e = createDiv().class("bodyMenu");

        e.child(createDiv(b.name));
        
        var massLabel = createElement("label", "Mass").class("bodyMenuSetting");
        massLabel.elt.classList.add("bodyMenuSettingLabel");
        massLabel.elt.htmlFor = b.name + "massInput";
        massLabel.elt.style.display = "none";

        var massInput = createElement("input").id(b.name +"massInput").class("bodyMenuSetting");
        massInput.elt.classList.add("bodyMenuSettingInput");
        massInput.elt.type = "text";
        massInput.elt.style.display = "none";
        massInput.elt.spellcheck = false;
        massInput.elt.value = b.mass;

        massInput.elt.addEventListener("input", bodyMenuMassSettingInput);

        e.child(massLabel);
        e.child(massInput);
        
    
        e.elt.addEventListener("mouseenter", bodyMenuMouseEnter);
        e.elt.addEventListener("mouseleave", bodyMenuMouseLeave);
        e.elt.addEventListener("click", bodyMenuClick);

        bodyMenus.push({name: b.name, element: e, distance: 0});
    }
}

function setPlayPause() {
    if (!playPause) playPause = document.getElementById("playPause");

    for(const c of playPause.children) {
        c.style.display = c.style.display == "none" ? "inline" : "none";
    }

    paused = paused == true ? false : true;
}

function bodyMenuMouseEnter(event) {
    console.log(event.currentTarget)
    event.currentTarget.classList.add("bodyMenuHighlight");
}

function bodyMenuMouseLeave(event) {
    event.currentTarget.classList.remove("bodyMenuHighlight");
    console.log(event.currentTarget);
}

function bodyMenuClick(event) {
    resetSelectedBodyMenu();

    event.currentTarget.classList.add("bodyMenuOpened");

    var selectedBodyMenuIndex = bodyMenus.findIndex(b => b.element.elt == event.currentTarget);

    selectedBodyMenu = bodyMenus[selectedBodyMenuIndex];
    selectedBodyMenu.element.style('z-index', BODY_DATA.length);

    bodyMenus.splice(selectedBodyMenuIndex, 1);

    for(const c of selectedBodyMenu.element.elt.childNodes) {
        if (c.classList.contains("bodyMenuSetting")) c.style.display = "inline-block";
    }
}

function bodyMenuMassSettingInput(event) {
    var body = bodies.find(b => b.name == selectedBodyMenu.name);

    body.mass = parseFloat(event.currentTarget.value);

    console.log(body.mass);
}

function backgroundMouseDown() {
    resetSelectedBodyMenu();

    drag = true;
}

function backgroundMouseUp() {
    drag = false;
}

function resetSelectedBodyMenu() {
    if (!selectedBodyMenu) return;

    selectedBodyMenu.element.elt.classList.remove("bodyMenuOpened");

    bodyMenus.push(selectedBodyMenu);

    for(const c of selectedBodyMenu.element.elt.childNodes) {
        if (c.classList.contains("bodyMenuSetting")) c.style.display = "none";
    }

    selectedBodyMenu = null;
}

function calcAccelerations() {
    var bodyForces = [];

    for (var i = 0; i < BODY_DATA.length; i++) {
        bodyForces.push({name: bodies[i].name, forces: Array(BODY_DATA.length).fill(null)});
    }

    for (var i = 0; i < bodyForces.length; i++) {
        for (var j = 0; j < bodyForces.length; j++) {
            if (i == j) continue;
            if (bodyForces[i].forces[j] != null) continue;

            var r = p5.Vector.sub(bodies[i].position, bodies[j].position);
            var rm = r.mag();

            var F = p5.Vector.mult(r,(G*bodies[i].mass*bodies[j].mass)/(rm ** 3) * (timeScale ** 2));

            bodyForces[i].forces[j] = p5.Vector.mult(F, -1);
            bodyForces[j].forces[i] = F;
        }
    }

    var accs = [];

    for (var i = 0; i < bodyForces.length; i++) {
        var F = createVector(0,0,0);

        for (var j = 0; j < bodyForces.length; j++) {
            if (bodyForces[i].forces[j] == null) continue;

            F.add(bodyForces[i].forces[j]);
        }

        var a = F.div(bodies[i].mass);

        var as = p5.Vector.div(a, AU).mult(simScale);

        accs.push({unscaled: a, scaled: as});
    }

    return accs;
}

function setPositions() {
    setVelocities();

        for (var i = 0; i < BODY_DATA.length; i++) {
            bodies[i].position.add(p5.Vector.mult(bodies[i].velocity, deltaTime/1000));
            bodies[i].positionsScaled[0].add(p5.Vector.mult(bodies[i].velocityScaled, deltaTime/1000));
        }
}

function setVelocities() {
    var accs = calcAccelerations();

    for (var i = 0; i < BODY_DATA.length; i++) {
        bodies[i].velocity.add(p5.Vector.mult(accs[i].unscaled, deltaTime/1000));
        bodies[i].velocityScaled.add(p5.Vector.mult(accs[i].scaled, deltaTime/1000));
    }
}

function setTimeScale(scale) {
    for (var i = 0; i < BODY_DATA.length; i++) {
        bodies[i].velocity.mult(scale/timeScale);
        bodies[i].velocityScaled.mult(scale/timeScale);
    }

    timeScale = scale;
}

function timeScaleRangeChange(event) {

}

function shiftPositions(bodyIndex) {
    if (lastSteps.length < BODY_DATA.length) {
        for (var j = 0; j < BODY_DATA.length; j++) {
            lastSteps.push({position: bodies[j].positionsScaled[bodies[j].positionsScaled.length - 1], distance: p5.Vector.dist(bodies[j].positionsScaled[bodies[j].positionsScaled.length - 2], bodies[j].positionsScaled[bodies[j].positionsScaled.length - 1])});
        }
    }

    var d = p5.Vector.dist(bodies[bodyIndex].positionsScaled[0], bodies[bodyIndex].positionsScaled[1]);

    var f = d/lastSteps[bodyIndex].distance;

    if (!isFinite(f)) return;



    bodies[bodyIndex].positionsScaled[bodies[bodyIndex].positionsScaled.length - 1] = p5.Vector.lerp(lastSteps[bodyIndex].position, bodies[bodyIndex].positionsScaled[bodies[bodyIndex].positionsScaled.length - 2], f);

    if (d > lastSteps[bodyIndex].distance) {
        bodies[bodyIndex].positionsScaled.splice(1,0,p5.Vector.lerp(bodies[bodyIndex].positionsScaled[1], bodies[bodyIndex].positionsScaled[0], 1/f));

        bodies[bodyIndex].positionsScaled.pop();

        lastSteps[bodyIndex] = {position: bodies[bodyIndex].positionsScaled[bodies[bodyIndex].positionsScaled.length - 1], distance: p5.Vector.dist(bodies[bodyIndex].positionsScaled[bodies[bodyIndex].positionsScaled.length - 2], bodies[bodyIndex].positionsScaled[bodies[bodyIndex].positionsScaled.length - 1])};

        shiftPositions(bodyIndex);
    
    }
}

function getScreenPosition(bodyPos) {
    var screenPos = screenPosition(bodyPos);

    // Check if the planet is behind the camera
    var cVector = createVector(cameraX, cameraY, cameraZ);

    var bMag = bodyPos.magSq();
    var cMag = cVector.magSq();

    var cross = bodyPos.dot(cVector);

    if (Math.sign(cross) > 0 && bMag > cMag) {
        screenPos = createVector(windowWidth,0);
    }

    return screenPos;
}

function mousePressed() {
    lastMouseX = mouseX;
    lastMouseY = mouseY;
}

function mouseDragged() {
    if (!drag) return;

    dragX = lastMouseX - mouseX;
    dragY = lastMouseY - mouseY;

    cameraAngleX -= dragX * cameraAngleSensitivity;
    cameraAngleY = constrain(cameraAngleY - dragY * cameraAngleSensitivity, 1, 179);

    lastMouseX = mouseX;
    lastMouseY = mouseY;

    // console.log("cameraAngleVector: " + cameraAngleX + ", " + cameraAngleY);
}

function mouseWheel(event) {
    resetSelectedBodyMenu();

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
    
    while (movements.length < BODY_DATA.length) {
        movements.push({position: p5.Vector, velocity: p5.Vector, positionsScaled: [], velocityScaled: p5.Vector});
    }

    for(var i = 0; i < movements.length; i++) {
        var trailStepTime = BODY_DATA[i].orbital_period/trailSteps * 365 * 24 * 60 * 60 * 1000;

        for(var j = 0; j < trailSteps; j++) {
            var m = window.lagrange.planet_positions.getPositions(Date.now() - j * trailStepTime, true);

            var p = createVector(m[i].position.y, -m[i].position.z, m[i].position.x);
            var v = createVector(m[i].velocity.y, -m[i].velocity.z, m[i].velocity.x);

            movements[i].positionsScaled[j] = p5.Vector.div(p, AU).mult(simScale);

            if (j == 0) {
                movements[i].position = p;
                movements[i].velocity = v;

                movements[i].velocityScaled = p5.Vector.div(v, AU).mult(simScale);
            }
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

        this.position = movement.position; // m, only item [0] can be expected to an unscaled representation of the planets position. This probably shouldn't be an array
        this.velocity = movement.velocity; // m/s, velocities probably shouldn't be returned as an array

        this.positionsScaled = movement.positionsScaled;
        this.velocityScaled = movement.velocityScaled;

        this.mass = info.mass; // kg
        this.radius = info.radius * 1000 // 
    }
}





