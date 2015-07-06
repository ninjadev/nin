function MountainLayer(layer) {
  this.segments = 192;
  this.halfSegments = 96;
  this.size = 8000;

  this.frame = 0;
  this.layer = layer;

  /* do loady stuff here */

  this.scene = new THREE.Scene();
  this.cameraController = new CameraController(layer.type);
  this.camera = this.cameraController.camera;
  this.scene.add(this.camera);

  this.initMountain();

  this.initWater();

  this.initTrees();

  this.setupLights();

  this.initSkyBox();
  Loader.start(function(){}, function(){});

  this.renderPass = new THREE.RenderPass(this.scene, this.camera);
};

MountainLayer.prototype.getEffectComposerPass = function() {
  return this.renderPass;
};

MountainLayer.prototype.initWater = function() {
  this.uniforms = {
    time: {
            type: "f",
            value: 0.1
          },
    time2: {
             type: "f",
             value: 0.1
           },
    //envMap: {type: "t", value: 1, texture: textureCube},
    texture2: {
                type: "t",
                value: Loader.loadTexture('res/water.jpg')
              },
    eyePos: {
              type: "v3",
              value: new THREE.Vector3(300, 50, 4)
            },
    waterHeight: {
                   type: "f",
                   value: 0.05
                 },
    amplitude: {
                 type: "fv1",
                 value: [.5, .25, .17, .125, .1, .083, .714, .063]
               },
    wavelength: {
                  type: "fv1",
                  value: [25.133, 12.566, 8.378, 6.283, 5.027, 4.189, 3.590, 3.142]
                },
    speed: {
             type: "fv1",
             value: [1.2, 2.0, 2.8, 3.6, 4.4, 5.2, 6.0, 6.8]
           }
  };

  var angle = [];
  for(var i=0; i<8; i++) {
    var a = Math.random() * (2.0942) + (-1.0471);
    angle[i] = new THREE.Vector2(Math.cos(a), Math.sin(a));
  }
  this.uniforms.direction = {type: "v2v", value: angle};

  this.uniforms.texture2.value.wrapS = this.uniforms.texture2.value.wrapT = THREE.RepeatWrapping;
  this.uniforms.texture2.value.repeat.set(25, 25);

  var xm = new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: SHADERS.water.vertexShader,
        fragmentShader: SHADERS.water.fragmentShader
    });

  var geometry = new THREE.PlaneGeometry(26000, 26000, 128, 128);
  var mesh = new THREE.Mesh(geometry, xm);
  mesh.rotation.x = -1.570796;
  this.scene.add(mesh);

  mesh.position.y = 50;
};


MountainLayer.prototype.initMountain = function() {

  this.mapData = this.generateHeight(this.segments, this.segments);

  var geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments - 1, this.segments - 1);
  geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));

  for (var i=0, l=geometry.vertices.length; i<l; i++) {
    geometry.vertices[i].y = this.mapData[i] * 10;
  }

  texture = new THREE.Texture(
      this.generateTexture(this.mapData, this.segments, this.segments),
      new THREE.UVMapping(),
      THREE.ClampToEdgeWrapping,
      THREE.ClampToEdgeWrapping
      );
  texture.needsUpdate = true;

  this.heightMap = (function(m,s){
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.height = canvas.width = s;
    var imageData = ctx.getImageData(0,0,s,s);
    for(var i=0; i<m.length;i++){
      var height = m[i];
      imageData.data[i*4 + 0] = height;
      imageData.data[i*4 + 1] = height;
      imageData.data[i*4 + 2] = height;
      imageData.data[i*4 + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    var tex = new THREE.Texture(canvas);
    tex.needsUpdate = true;
    return tex;
  })(this.mapData, this.segments);

  this.mountainuniforms = {
    time: {type:'f', value: 0},
    party: {type:'f', value: 0},
    gravel: {type: 't', value: Loader.loadTexture('res/dirt.jpg')},
    grass: {type: 't', value: Loader.loadTexture('res/floral.jpg')},
    height: {type: 't', value: this.heightMap}
  };

  this.mountainuniforms.gravel.value.wrapS = this.mountainuniforms.gravel.value.wrapT = THREE.RepeatWrapping;
  this.mountainuniforms.grass.value.wrapS = this.mountainuniforms.grass.value.wrapT = THREE.RepeatWrapping;

  var material = new THREE.ShaderMaterial({
    uniforms: this.mountainuniforms,
    vertexShader: SHADERS.mountain.vertexShader,
    fragmentShader: SHADERS.mountain.fragmentShader
  });
  this.mountainMesh = new THREE.Mesh(geometry, material);
  this.scene.add(this.mountainMesh);
};

MountainLayer.prototype.initTrees = function() {
  var tree = new Tree();
  this.trees = [];
  Math.seedrandom("the-forest");
  var treesPlaced = 0;
  while (treesPlaced < 100) {
    var pos = {
      x: Math.random()*6000-3000,
      y: Math.random()*1000+9000,
      z: Math.random()*6000-3000
    };
    yPos = this.getYValue(pos.x, pos.z);
    if (yPos < 400 && yPos > 60) {
      this.trees[treesPlaced] = tree.clone();

      this.trees[treesPlaced].position = pos;
      this.trees[treesPlaced].startYPos = this.trees[treesPlaced].position.y;
      this.trees[treesPlaced].finalYPos = yPos;
      this.trees[treesPlaced].delay = Math.random()*600+600;

      this.scene.add(this.trees[treesPlaced]);
      treesPlaced++;
    }
  }
  var finalI = -1;
  var minY = 10000;
  for (var i=0; i < this.trees.length; i++) {
    if (this.trees[i].finalYPos < minY) {
      minY = this.trees[i].finalYPos;
      finalI = i;
    }
  }
};


MountainLayer.prototype.reset = function(){
};

MountainLayer.prototype.update = function(frame, relativeFrame){
  var t = frame * 1000 / 60;
  var relativeT = relativeFrame * 1000 / 60;

  this.mountainuniforms.time.value = t;
  this.mountainuniforms.party.value = +(t > 32180);

  this.cameraController.updateCamera(relativeFrame);

  this.uniforms.time.value = t/1500;
  this.uniforms.time2.value = t/1500;
  this.uniforms.eyePos.value = this.camera.position;

  this.updateTrees(relativeT);
};

MountainLayer.prototype.updateTrees = function(relativeT) {
  var t = this.layer.startFrame / 60 + relativeT;
  if (relativeT < 4000) {
    for (var i=0; i < this.trees.length; i++) {
      if (t > this.startTime + this.trees[i].delay) {
        var treeAnimationTime = (relativeT - this.trees[i].delay)/(4000-this.trees[i].delay);
        this.trees[i].position.y = smoothstep(10000, this.trees[i].finalYPos, treeAnimationTime);
      }
    }
  } else {
    for (var i=0; i < this.trees.length; i++) {
      var moveFactor = (i%2) ? 10 : -10;
      this.trees[i].position.y = moveFactor * Math.sin( (relativeT-4000) / 250*Math.PI ) + this.trees[i].finalYPos;
    }
  }
}

MountainLayer.prototype.render = function(renderer, interpolation){
  /* do rendery stuff here */
  renderer.render(this.scene, this.camera);
};

MountainLayer.prototype.setupLights = function() {
  var light = new THREE.DirectionalLight(0xdefbff, 1.75);
  light.position.set(50, 200, 100);
  light.position.multiplyScalar(1.3);
  this.scene.add(light);
};

MountainLayer.prototype.generateHeight = function(width, height) {

  var size = width * height, data = new Float32Array(size);

  Math.seedrandom("0");
  var perlin = new ImprovedNoise(), quality = 1, z = Math.random() * 100;

  for (var i=0; i < size; i++) {
    data[i] = 0;
  }

  for (var j=0; j<4; j++) {
    for (var i=0; i < size; i++) {
      var x = i % width, y = ~~ (i / width);
      var radius = Math.sqrt(Math.pow(x-width/2, 2) + Math.pow(y-height/2, 2));
      var heightRatio = Math.max(1-radius/width*2, 0);
      data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * Math.pow(heightRatio,2) * 5);
    }
    quality *= 5;
  }

  return data;
};

MountainLayer.prototype.generateTexture = function(data, width, height) {

  var canvas, canvasScaled, context, image, imageData,
      level, diff, vector3, sun, shade;

  vector3 = new THREE.Vector3(0, 0, 0);

  sun = new THREE.Vector3(1, 1, 1);
  sun.normalize();

  canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  context = canvas.getContext('2d');
  context.fillStyle = '#000';
  context.fillRect(0, 0, width, height);

  image = context.getImageData(0, 0, canvas.width, canvas.height);
  imageData = image.data;

  for (var i=0, j=0, l=imageData.length; i<l; i+=4, j++) {

    vector3.x = data[j-2] - data[j+2];
    vector3.y = 2;
    vector3.z = data[j - width*2] - data[j + width*2];
    vector3.normalize();

    shade = vector3.dot(sun);

    imageData[i] = ( 96 + shade * 128 ) * ( 0.5 + data[j] * 0.007 );
    imageData[i + 1] = ( 96 + shade * 128 ) * ( 0.5 + data[j] * 0.007 );
    imageData[i + 2] = ( 96 + shade * 128 ) * ( 0.5 + data[j] * 0.007 );

  }

  context.putImageData(image, 0, 0);

  // Scaled 4x

  canvasScaled = document.createElement('canvas');
  canvasScaled.width = width * 4;
  canvasScaled.height = height * 4;

  context = canvasScaled.getContext('2d');
  context.scale(4, 4);
  context.drawImage(canvas, 0, 0);

  image = context.getImageData(0, 0, canvasScaled.width, canvasScaled.height);
  imageData = image.data;

  Math.seedrandom(".theterrain");
  for (var i=0, l = imageData.length; i<l; i+=4) {

    var v = ~~ (Math.random() * 5);

    imageData[i] += v;
    imageData[i + 1] += v;
    imageData[i + 2] += v;

  }

  context.putImageData(image, 0, 0);

  return canvasScaled;
};

MountainLayer.prototype.getYValue = function(x,z) {
  if ( z > this.size/2
      || z < -this.size/2
      || x > this.size/2
      || x < -this.size/2) {
    return false;
  }

  var factor = this.size / this.segments;

  var scaled_x = ( x / factor ) | 0;
  var scaled_z = ( z / factor ) | 0;

  var dataIndex = ( this.segments/2 + scaled_x ) + this.segments * ( this.segments/2 + scaled_z);
  var height = this.mapData[ dataIndex ] * 10; // geometry is scaled by this value 

  return height;
};

MountainLayer.prototype.initSkyBox = function() {
  var skyGeometry = new THREE.BoxGeometry( 26000, 26000, 26000 );
  var materialArray = [];
  var material =  new THREE.MeshBasicMaterial({
    map: Loader.loadTexture('res/red_floral.jpg'),
    side: THREE.BackSide
  });
  for (var i = 0; i < 6; i++) {
    materialArray[i] = material;
  }
  var skyMaterial = new THREE.MeshFaceMaterial(materialArray);
  var skyBox = new THREE.Mesh(skyGeometry, skyMaterial);
  skyBox.position.y = 12000;
  this.scene.add(skyBox);
};

function Tree() {
    var combined = new THREE.Geometry();
    var matrix = new THREE.Matrix4();

    var topGeometry = new THREE.CylinderGeometry(0, 35, 70, 6, 6, false);
    topGeometry.applyMatrix(matrix.makeTranslation(0, 115, 0));

    var middleGeometry = new THREE.CylinderGeometry(15, 45, 60, 6, 6, false);
    middleGeometry.applyMatrix(matrix.makeTranslation(0, 55, 0));

    var bottomGeometry = new THREE.CylinderGeometry(10, 10, 55, 3, 3, true);

    topGeometry.merge(middleGeometry);

    var repeat = 30;
    var grassMap = Loader.loadTexture('res/grasstile_c.jpg');

    grassMap.wrapS = grassMap.wrapT = THREE.RepeatWrapping;
    grassMap.repeat.set(repeat,repeat);
    grassMap.anisotropy = 16;

    this.topPart = new THREE.Mesh(topGeometry, new THREE.MeshLambertMaterial({
        map: grassMap
    }));
    this.bottomPart = new THREE.Mesh(bottomGeometry, new THREE.MeshLambertMaterial({color: 0x884400}));

    this.tree = new THREE.Object3D();
    this.tree.add(this.topPart);
    this.tree.add(this.bottomPart);

    return this.tree;
}
