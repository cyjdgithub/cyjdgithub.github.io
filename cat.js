window.onload = function main() {

	var gl = initialize();

	var dropdown = document.getElementById("dropdown");
    
    var flag = true;
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	var file = "kitten.obj";
	readOBJFile(gl, file);
}

function initialize() {

    var canvas = document.getElementById('gl-canvas');

    var gl = WebGLUtils.setupWebGL(canvas);

    if (!gl) {
        alert("不能打开内容");
        return;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    gl.program = initShaders(gl, 'vertex-shader-phong', 'fragment-shader-phong');

    gl.useProgram(gl.program);

    gl.u_ModelMatrix =  gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    gl.u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    gl.u_Projection = gl.getUniformLocation(gl.program, 'u_Projection');

    return gl;
}


function readOBJFile(gl, file) {
	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
		if (request.readyState == 4 && request.status == 200) {
			data = request.responseText;
			var obj = new ObjectModel(data, gl);
			display(gl, obj);
		}
	}
	request.open("GET", file, true);
	request.send();
}

var materialData = [];

function ObjectModel(data, gl) {

	var vertices = [];
	var verticesIndex = [];
	var normals = [];
	var normalsIndex = [];
	var textures = [];
	var texturesIndex = [];
	var name = "";
	var renderType = "";

	var lines = data.split("\n");

	var fixedVertices = [];
	var fixedIndices = [];
	var fixedNormals = [];
	var fixedTextures = [];
	var count = 0;

	var texturesGiven = false;
	var normalsGiven = false;

	var mData = [];

	var selfNormalArray = [];

	var maxY = 0;
	var minY = 0;
	var maxX = 0;
	var minX = 0;

	lines.forEach(function(line) {

		var tokens = line.split(" ");

		if (tokens[0] === "g") {
			name = tokens[1];
		}
		else if (tokens[0] === "v") {
			for (var i = 1; i < tokens.length; i++) {
				vertices.push(parseFloat(tokens[i]));
				if (i == 2 && parseFloat(tokens[i]) > maxY) {
					maxY = parseFloat(tokens[i]);
				} else if (i == 2 && parseFloat(tokens[i]) < minY) {
					minY = parseFloat(tokens[i]);
				} else if (i == 1 && parseFloat(tokens[i]) > maxX) {
					maxX = parseFloat(tokens[i]);
				} else if (i == 1 && parseFloat(tokens[i]) < minX) {
					minX = parseFloat(tokens[i]);
				}
			}
			selfNormalArray.push([]);
		}
		else if (tokens[0] == "vt") {
			for (var i = 1; i < tokens.length; i++) {
				textures.push(parseFloat(tokens[i]));
			}
		}
		else if (tokens[0] == "vn") {
			for (var i = 1; i < tokens.length; i++) {
				normals.push(parseFloat(tokens[i]));
			}
		}
		else if (tokens[0] === "p") {
			for (var i = 1; i < tokens.length; i++) {
				verticesIndex.push(parseFloat(tokens[i]));
			}
			if (renderType === "") {
				renderType = "points";
			} 
		}
		else if (tokens[0] === "l") {
			for (var i = 1; i < tokens.length; i++) {
				verticesIndex.push(parseFloat(tokens[i]));
			}
			if (renderType === "") {
				renderType = "lines";
			} 
		}
		else if (tokens[0] === "f") {
			var faceFormat = faceFormatType(tokens);
			if (tokens.length == 4) {			
					var values1 = tokens[1].split("/");
					var values2 = tokens[2].split("/");
					var values3 = tokens[3].split("/");
				if (faceFormat == 0) {			
					verticesIndex.push(parseInt(values1[0]) - 1);
					verticesIndex.push(parseInt(values2[0]) - 1);
					verticesIndex.push(parseInt(values3[0]) - 1);

					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3 + 2]);
					fixedVertices.push(vertices[(parseInt(values2[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values2[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values2[0]) - 1)*3 + 2]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3 + 2]);

					fixedIndices.push(count++);
					fixedIndices.push(count++);
					fixedIndices.push(count++);

					var p1 = vec3(vertices[(parseInt(values1[0])-1)*3],
									vertices[(parseInt(values1[0])-1)*3 + 1],
									vertices[(parseInt(values1[0])-1)*3 + 2]);
					var p2 = vec3(vertices[(parseInt(values2[0])-1)*3],
									vertices[(parseInt(values2[0])-1)*3 + 1],
									vertices[(parseInt(values2[0])-1)*3 + 2]);
					var p3 = vec3(vertices[(parseInt(values3[0])-1)*3],
									vertices[(parseInt(values3[0])-1)*3 + 1],
									vertices[(parseInt(values3[0])-1)*3 + 2]);

					var Ux = p2[0] - p1[0];
					var Uy = p2[1] - p1[1];
					var Uz = p2[2] - p1[2];

					var Vx = p3[0] - p1[0];
					var Vy = p3[1] - p1[1];
					var Vz = p3[2] - p1[2];

					var Nx = (Uy*Vz) - (Uz*Vy);
					var Ny = (Uz*Vx) - (Ux*Vz);
					var Nz = (Ux*Vy) - (Uy*Vx);

					var normalize = Math.sqrt(Nx*Nx + Ny*Ny + Nz*Nz);

					var N = vec3(Nx/normalize, Ny/normalize, Nz/normalize);

					selfNormalArray[parseInt(values1[0]) - 1].push(N);
					selfNormalArray[parseInt(values2[0]) - 1].push(N);
					selfNormalArray[parseInt(values3[0]) - 1].push(N);


				} else if (faceFormat == 1) {	

					verticesIndex.push(parseInt(values1[0]) - 1);
					verticesIndex.push(parseInt(values2[0]) - 1);
					verticesIndex.push(parseInt(values3[0]) - 1);

					texturesIndex.push(parseInt(values1[1]) - 1);
					texturesIndex.push(parseInt(values2[1]) - 1);
					texturesIndex.push(parseInt(values3[1]) - 1);

					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3 + 2]);
					fixedVertices.push(vertices[(parseInt(values2[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values2[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values2[0]) - 1)*3 + 2]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3 + 2]);

					fixedTextures.push(textures[(parseInt(values1[1]) - 1)*3]);
					fixedTextures.push(textures[(parseInt(values1[1]) - 1)*3 + 1]);
					fixedTextures.push(textures[(parseInt(values1[1]) - 1)*3 + 2]);
					fixedTextures.push(textures[(parseInt(values2[1]) - 1)*3]);
					fixedTextures.push(textures[(parseInt(values2[1]) - 1)*3 + 1]);
					fixedTextures.push(textures[(parseInt(values2[1]) - 1)*3 + 2]);
					fixedTextures.push(textures[(parseInt(values3[1]) - 1)*3]);
					fixedTextures.push(textures[(parseInt(values3[1]) - 1)*3 + 1]);
					fixedTextures.push(textures[(parseInt(values3[1]) - 1)*3 + 2]);

					fixedIndices.push(count++);
					fixedIndices.push(count++);
					fixedIndices.push(count++);

					texturesGiven = true;

					var p1 = vec3(vertices[(parseInt(values1[0])-1)*3],
									vertices[(parseInt(values1[0])-1)*3 + 1],
									vertices[(parseInt(values1[0])-1)*3 + 2]);
					var p2 = vec3(vertices[(parseInt(values2[0])-1)*3],
									vertices[(parseInt(values2[0])-1)*3 + 1],
									vertices[(parseInt(values2[0])-1)*3 + 2]);
					var p3 = vec3(vertices[(parseInt(values3[0])-1)*3],
									vertices[(parseInt(values3[0])-1)*3 + 1],
									vertices[(parseInt(values3[0])-1)*3 + 2]);

					var Ux = p2[0] - p1[0];
					var Uy = p2[1] - p1[1];
					var Uz = p2[2] - p1[2];

					var Vx = p3[0] - p1[0];
					var Vy = p3[1] - p1[1];
					var Vz = p3[2] - p1[2];

					var Nx = (Uy*Vz) - (Uz*Vy);
					var Ny = (Uz*Vx) - (Ux*Vz);
					var Nz = (Ux*Vy) - (Uy*Vx);

					var normalize = Math.sqrt(Nx*Nx + Ny*Ny + Nz*Nz);

					var N = vec3(Nx/normalize, Ny/normalize, Nz/normalize);

					selfNormalArray[parseInt(values1[0]) - 1].push(N);
					selfNormalArray[parseInt(values2[0]) - 1].push(N);
					selfNormalArray[parseInt(values3[0]) - 1].push(N);

				} else if (faceFormat == 2) {	

					verticesIndex.push(parseInt(values1[0]) - 1);
					verticesIndex.push(parseInt(values2[0]) - 1);
					verticesIndex.push(parseInt(values3[0]) - 1);

					normalsIndex.push(parseInt(values1[2]) - 1);
					normalsIndex.push(parseInt(values2[2]) - 1);
					normalsIndex.push(parseInt(values3[2]) - 1);

					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3 + 2]);
					fixedVertices.push(vertices[(parseInt(values2[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values2[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values2[0]) - 1)*3 + 2]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3 + 2]);

					fixedNormals.push(normals[(parseInt(values1[2]) - 1)*3]);
					fixedNormals.push(normals[(parseInt(values1[2]) - 1)*3 + 1]);
					fixedNormals.push(normals[(parseInt(values1[2]) - 1)*3 + 2]);
					fixedNormals.push(normals[(parseInt(values2[2]) - 1)*3]);
					fixedNormals.push(normals[(parseInt(values2[2]) - 1)*3 + 1]);
					fixedNormals.push(normals[(parseInt(values2[2]) - 1)*3 + 2]);
					fixedNormals.push(normals[(parseInt(values3[2]) - 1)*3]);
					fixedNormals.push(normals[(parseInt(values3[2]) - 1)*3 + 1]);
					fixedNormals.push(normals[(parseInt(values3[2]) - 1)*3 + 2]);

					fixedIndices.push(count++);
					fixedIndices.push(count++);
					fixedIndices.push(count++);

					normalsGiven = true;

				} else if (faceFormat == 3) {	

					verticesIndex.push(parseInt(values1[0]) - 1);
					verticesIndex.push(parseInt(values2[0]) - 1);
					verticesIndex.push(parseInt(values3[0]) - 1);

					texturesIndex.push(parseInt(values1[1]) - 1);
					texturesIndex.push(parseInt(values2[1]) - 1);
					texturesIndex.push(parseInt(values3[1]) - 1);

					normalsIndex.push(parseInt(values1[2]) - 1);
					normalsIndex.push(parseInt(values2[2]) - 1);
					normalsIndex.push(parseInt(values3[2]) - 1);

					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3 + 2]);
					fixedVertices.push(vertices[(parseInt(values2[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values2[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values2[0]) - 1)*3 + 2]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3 + 2]);

					fixedTextures.push(textures[(parseInt(values1[1]) - 1)*3]);
					fixedTextures.push(textures[(parseInt(values1[1]) - 1)*3 + 1]);
					fixedTextures.push(textures[(parseInt(values1[1]) - 1)*3 + 2]);
					fixedTextures.push(textures[(parseInt(values2[1]) - 1)*3]);
					fixedTextures.push(textures[(parseInt(values2[1]) - 1)*3 + 1]);
					fixedTextures.push(textures[(parseInt(values2[1]) - 1)*3 + 2]);
					fixedTextures.push(textures[(parseInt(values3[1]) - 1)*3]);
					fixedTextures.push(textures[(parseInt(values3[1]) - 1)*3 + 1]);
					fixedTextures.push(textures[(parseInt(values3[1]) - 1)*3 + 2]);

					fixedNormals.push(normals[(parseInt(values1[2]) - 1)*3]);
					fixedNormals.push(normals[(parseInt(values1[2]) - 1)*3 + 1]);
					fixedNormals.push(normals[(parseInt(values1[2]) - 1)*3 + 2]);
					fixedNormals.push(normals[(parseInt(values2[2]) - 1)*3]);
					fixedNormals.push(normals[(parseInt(values2[2]) - 1)*3 + 1]);
					fixedNormals.push(normals[(parseInt(values2[2]) - 1)*3 + 2]);
					fixedNormals.push(normals[(parseInt(values3[2]) - 1)*3]);
					fixedNormals.push(normals[(parseInt(values3[2]) - 1)*3 + 1]);
					fixedNormals.push(normals[(parseInt(values3[2]) - 1)*3 + 2]);

					fixedIndices.push(count++);
					fixedIndices.push(count++);
					fixedIndices.push(count++);

					texturesGiven = true;
					normalsGiven = true;

				} else {

					console.log("Error: File format inconsistent with obj standard");
					error();
					return;

				}

			} else if (tokens.length == 5) {	

				var values1 = tokens[1].split("/");
				var values2 = tokens[2].split("/");
				var values3 = tokens[3].split("/");
				var values4 = tokens[4].split("/");

				if (faceFormat == 0) {			

					verticesIndex.push(parseInt(values1[0]) - 1);
					verticesIndex.push(parseInt(values2[0]) - 1);
					verticesIndex.push(parseInt(values3[0]) - 1);
					verticesIndex.push(parseInt(values4[0]) - 1);

					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3 + 2]);
					fixedVertices.push(vertices[(parseInt(values2[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values2[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values2[0]) - 1)*3 + 2]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3 + 2]);

					// 2nd triangle of quad
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3 + 2]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3 + 2]);
					fixedVertices.push(vertices[(parseInt(values4[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values4[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values4[0]) - 1)*3 + 2]);

					fixedIndices.push(count++);
					fixedIndices.push(count++);
					fixedIndices.push(count++);
					fixedIndices.push(count++);
					fixedIndices.push(count++);
					fixedIndices.push(count++);

					var p1 = vec3(vertices[(parseInt(values1[0])-1)*3],
									vertices[(parseInt(values1[0])-1)*3 + 1],
									vertices[(parseInt(values1[0])-1)*3 + 2]);
					var p2 = vec3(vertices[(parseInt(values2[0])-1)*3],
									vertices[(parseInt(values2[0])-1)*3 + 1],
									vertices[(parseInt(values2[0])-1)*3 + 2]);
					var p3 = vec3(vertices[(parseInt(values3[0])-1)*3],
									vertices[(parseInt(values3[0])-1)*3 + 1],
									vertices[(parseInt(values3[0])-1)*3 + 2]);

					var p4 = vec3(vertices[(parseInt(values4[0])-1)*3],
									vertices[(parseInt(values4[0])-1)*3 + 1],
									vertices[(parseInt(values4[0])-1)*3 + 2]);

					var Ux = p2[0] - p1[0];
					var Uy = p2[1] - p1[1];
					var Uz = p2[2] - p1[2];

					var Vx = p3[0] - p1[0];
					var Vy = p3[1] - p1[1];
					var Vz = p3[2] - p1[2];

					var Nx = (Uy*Vz) - (Uz*Vy);
					var Ny = (Uz*Vx) - (Ux*Vz);
					var Nz = (Ux*Vy) - (Uy*Vx);

					var normalize = Math.sqrt(Nx*Nx + Ny*Ny + Nz*Nz);

					var N = vec3(Nx/normalize, Ny/normalize, Nz/normalize);

					selfNormalArray[parseInt(values1[0]) - 1].push(N);
					selfNormalArray[parseInt(values2[0]) - 1].push(N);
					selfNormalArray[parseInt(values3[0]) - 1].push(N);

					var Ux = p3[0] - p1[0];
					var Uy = p3[1] - p1[1];
					var Uz = p3[2] - p1[2];

					var Vx = p4[0] - p1[0];
					var Vy = p4[1] - p1[1];
					var Vz = p4[2] - p1[2];

					var Nx = (Uy*Vz) - (Uz*Vy);
					var Ny = (Uz*Vx) - (Ux*Vz);
					var Nz = (Ux*Vy) - (Uy*Vx);

					var normalize = Math.sqrt(Nx*Nx + Ny*Ny + Nz*Nz);

					var N = vec3(Nx/normalize, Ny/normalize, Nz/normalize);

					selfNormalArray[parseInt(values1[0]) - 1].push(N);
					selfNormalArray[parseInt(values3[0]) - 1].push(N);
					selfNormalArray[parseInt(values4[0]) - 1].push(N);

				} else if (faceFormat == 1) {	

					verticesIndex.push(parseInt(values1[0]) - 1);
					verticesIndex.push(parseInt(values2[0]) - 1);
					verticesIndex.push(parseInt(values3[0]) - 1);
					verticesIndex.push(parseInt(values4[0]) - 1);

					texturesIndex.push(parseInt(values1[1]) - 1);
					texturesIndex.push(parseInt(values2[1]) - 1);
					texturesIndex.push(parseInt(values3[1]) - 1);
					texturesIndex.push(parseInt(values4[1]) - 1);

					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3 + 2]);
					fixedVertices.push(vertices[(parseInt(values2[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values2[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values2[0]) - 1)*3 + 2]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3 + 2]);

					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3 + 2]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3 + 2]);
					fixedVertices.push(vertices[(parseInt(values4[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values4[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values4[0]) - 1)*3 + 2]);

					fixedTextures.push(textures[(parseInt(values1[1]) - 1)*3]);
					fixedTextures.push(textures[(parseInt(values1[1]) - 1)*3 + 1]);
					fixedTextures.push(textures[(parseInt(values1[1]) - 1)*3 + 2]);
					fixedTextures.push(textures[(parseInt(values2[1]) - 1)*3]);
					fixedTextures.push(textures[(parseInt(values2[1]) - 1)*3 + 1]);
					fixedTextures.push(textures[(parseInt(values2[1]) - 1)*3 + 2]);
					fixedTextures.push(textures[(parseInt(values3[1]) - 1)*3]);
					fixedTextures.push(textures[(parseInt(values3[1]) - 1)*3 + 1]);
					fixedTextures.push(textures[(parseInt(values3[1]) - 1)*3 + 2]);

					fixedTextures.push(textures[(parseInt(values1[1]) - 1)*3]);
					fixedTextures.push(textures[(parseInt(values1[1]) - 1)*3 + 1]);
					fixedTextures.push(textures[(parseInt(values1[1]) - 1)*3 + 2]);
					fixedTextures.push(textures[(parseInt(values3[1]) - 1)*3]);
					fixedTextures.push(textures[(parseInt(values3[1]) - 1)*3 + 1]);
					fixedTextures.push(textures[(parseInt(values3[1]) - 1)*3 + 2]);
					fixedTextures.push(textures[(parseInt(values4[1]) - 1)*3]);
					fixedTextures.push(textures[(parseInt(values4[1]) - 1)*3 + 1]);
					fixedTextures.push(textures[(parseInt(values4[1]) - 1)*3 + 2]);

					fixedIndices.push(count++);
					fixedIndices.push(count++);
					fixedIndices.push(count++);
					fixedIndices.push(count++);
					fixedIndices.push(count++);
					fixedIndices.push(count++);

					texturesGiven = true;

					var p1 = vec3(vertices[(parseInt(values1[0])-1)*3],
									vertices[(parseInt(values1[0])-1)*3 + 1],
									vertices[(parseInt(values1[0])-1)*3 + 2]);
					var p2 = vec3(vertices[(parseInt(values2[0])-1)*3],
									vertices[(parseInt(values2[0])-1)*3 + 1],
									vertices[(parseInt(values2[0])-1)*3 + 2]);
					var p3 = vec3(vertices[(parseInt(values3[0])-1)*3],
									vertices[(parseInt(values3[0])-1)*3 + 1],
									vertices[(parseInt(values3[0])-1)*3 + 2]);
					var p4 = vec3(vertices[(parseInt(values4[0])-1)*3],
									vertices[(parseInt(values4[0])-1)*3 + 1],
									vertices[(parseInt(values4[0])-1)*3 + 2]);

					var Ux = p2[0] - p1[0];
					var Uy = p2[1] - p1[1];
					var Uz = p2[2] - p1[2];

					var Vx = p3[0] - p1[0];
					var Vy = p3[1] - p1[1];
					var Vz = p3[2] - p1[2];

					var Nx = (Uy*Vz) - (Uz*Vy);
					var Ny = (Uz*Vx) - (Ux*Vz);
					var Nz = (Ux*Vy) - (Uy*Vx);

					var normalize = Math.sqrt(Nx*Nx + Ny*Ny + Nz*Nz);

					var N = vec3(Nx/normalize, Ny/normalize, Nz/normalize);

					selfNormalArray[parseInt(values1[0]) - 1].push(N);
					selfNormalArray[parseInt(values2[0]) - 1].push(N);
					selfNormalArray[parseInt(values3[0]) - 1].push(N);

					var Ux = p3[0] - p1[0];
					var Uy = p3[1] - p1[1];
					var Uz = p3[2] - p1[2];

					var Vx = p4[0] - p1[0];
					var Vy = p4[1] - p1[1];
					var Vz = p4[2] - p1[2];

					var Nx = (Uy*Vz) - (Uz*Vy);
					var Ny = (Uz*Vx) - (Ux*Vz);
					var Nz = (Ux*Vy) - (Uy*Vx);

					var normalize = Math.sqrt(Nx*Nx + Ny*Ny + Nz*Nz);

					var N = vec3(Nx/normalize, Ny/normalize, Nz/normalize);

					selfNormalArray[parseInt(values1[0]) - 1].push(N);
					selfNormalArray[parseInt(values3[0]) - 1].push(N);
					selfNormalArray[parseInt(values4[0]) - 1].push(N);

				} else if (faceFormat == 2) {	

					verticesIndex.push(parseInt(values1[0]) - 1);
					verticesIndex.push(parseInt(values2[0]) - 1);
					verticesIndex.push(parseInt(values3[0]) - 1);
					verticesIndex.push(parseInt(values4[0]) - 1);

					normalsIndex.push(parseInt(values1[2]) - 1);
					normalsIndex.push(parseInt(values2[2]) - 1);
					normalsIndex.push(parseInt(values3[2]) - 1);
					normalsIndex.push(parseInt(values4[2]) - 1);

					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3 + 2]);
					fixedVertices.push(vertices[(parseInt(values2[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values2[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values2[0]) - 1)*3 + 2]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3 + 2]);

					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3 + 2]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3 + 2]);
					fixedVertices.push(vertices[(parseInt(values4[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values4[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values4[0]) - 1)*3 + 2]);

					fixedNormals.push(normals[(parseInt(values1[2]) - 1)*3]);
					fixedNormals.push(normals[(parseInt(values1[2]) - 1)*3 + 1]);
					fixedNormals.push(normals[(parseInt(values1[2]) - 1)*3 + 2]);
					fixedNormals.push(normals[(parseInt(values2[2]) - 1)*3]);
					fixedNormals.push(normals[(parseInt(values2[2]) - 1)*3 + 1]);
					fixedNormals.push(normals[(parseInt(values2[2]) - 1)*3 + 2]);
					fixedNormals.push(normals[(parseInt(values3[2]) - 1)*3]);
					fixedNormals.push(normals[(parseInt(values3[2]) - 1)*3 + 1]);
					fixedNormals.push(normals[(parseInt(values3[2]) - 1)*3 + 2]);

					fixedNormals.push(normals[(parseInt(values1[2]) - 1)*3]);
					fixedNormals.push(normals[(parseInt(values1[2]) - 1)*3 + 1]);
					fixedNormals.push(normals[(parseInt(values1[2]) - 1)*3 + 2]);
					fixedNormals.push(normals[(parseInt(values3[2]) - 1)*3]);
					fixedNormals.push(normals[(parseInt(values3[2]) - 1)*3 + 1]);
					fixedNormals.push(normals[(parseInt(values3[2]) - 1)*3 + 2]);
					fixedNormals.push(normals[(parseInt(values4[2]) - 1)*3]);
					fixedNormals.push(normals[(parseInt(values4[2]) - 1)*3 + 1]);
					fixedNormals.push(normals[(parseInt(values4[2]) - 1)*3 + 2]);

					fixedIndices.push(count++);
					fixedIndices.push(count++);
					fixedIndices.push(count++);
					fixedIndices.push(count++);
					fixedIndices.push(count++);
					fixedIndices.push(count++);

					normalsGiven = true;

				} else if (faceFormat == 3) {	

					verticesIndex.push(parseInt(values1[0]) - 1);
					verticesIndex.push(parseInt(values2[0]) - 1);
					verticesIndex.push(parseInt(values3[0]) - 1);
					verticesIndex.push(parseInt(values4[0]) - 1);

					texturesIndex.push(parseInt(values1[1]) - 1);
					texturesIndex.push(parseInt(values2[1]) - 1);
					texturesIndex.push(parseInt(values3[1]) - 1);
					texturesIndex.push(parseInt(values4[1]) - 1);

					normalsIndex.push(parseInt(values1[2]) - 1);
					normalsIndex.push(parseInt(values2[2]) - 1);
					normalsIndex.push(parseInt(values3[2]) - 1);
					normalsIndex.push(parseInt(values4[2]) - 1);

					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3 + 2]);
					fixedVertices.push(vertices[(parseInt(values2[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values2[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values2[0]) - 1)*3 + 2]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3 + 2]);

					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values1[0]) - 1)*3 + 2]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values3[0]) - 1)*3 + 2]);
					fixedVertices.push(vertices[(parseInt(values4[0]) - 1)*3]);
					fixedVertices.push(vertices[(parseInt(values4[0]) - 1)*3 + 1]);
					fixedVertices.push(vertices[(parseInt(values4[0]) - 1)*3 + 2]);

					fixedTextures.push(textures[(parseInt(values1[1]) - 1)*3]);
					fixedTextures.push(textures[(parseInt(values1[1]) - 1)*3 + 1]);
					fixedTextures.push(textures[(parseInt(values1[1]) - 1)*3 + 2]);
					fixedTextures.push(textures[(parseInt(values2[1]) - 1)*3]);
					fixedTextures.push(textures[(parseInt(values2[1]) - 1)*3 + 1]);
					fixedTextures.push(textures[(parseInt(values2[1]) - 1)*3 + 2]);
					fixedTextures.push(textures[(parseInt(values3[1]) - 1)*3]);
					fixedTextures.push(textures[(parseInt(values3[1]) - 1)*3 + 1]);
					fixedTextures.push(textures[(parseInt(values3[1]) - 1)*3 + 2]);

					fixedTextures.push(textures[(parseInt(values1[1]) - 1)*3]);
					fixedTextures.push(textures[(parseInt(values1[1]) - 1)*3 + 1]);
					fixedTextures.push(textures[(parseInt(values1[1]) - 1)*3 + 2]);
					fixedTextures.push(textures[(parseInt(values3[1]) - 1)*3]);
					fixedTextures.push(textures[(parseInt(values3[1]) - 1)*3 + 1]);
					fixedTextures.push(textures[(parseInt(values3[1]) - 1)*3 + 2]);
					fixedTextures.push(textures[(parseInt(values4[1]) - 1)*3]);
					fixedTextures.push(textures[(parseInt(values4[1]) - 1)*3 + 1]);
					fixedTextures.push(textures[(parseInt(values4[1]) - 1)*3 + 2]);

					fixedNormals.push(normals[(parseInt(values1[2]) - 1)*3]);
					fixedNormals.push(normals[(parseInt(values1[2]) - 1)*3 + 1]);
					fixedNormals.push(normals[(parseInt(values1[2]) - 1)*3 + 2]);
					fixedNormals.push(normals[(parseInt(values2[2]) - 1)*3]);
					fixedNormals.push(normals[(parseInt(values2[2]) - 1)*3 + 1]);
					fixedNormals.push(normals[(parseInt(values2[2]) - 1)*3 + 2]);
					fixedNormals.push(normals[(parseInt(values3[2]) - 1)*3]);
					fixedNormals.push(normals[(parseInt(values3[2]) - 1)*3 + 1]);
					fixedNormals.push(normals[(parseInt(values3[2]) - 1)*3 + 2]);

					fixedNormals.push(normals[(parseInt(values1[2]) - 1)*3]);
					fixedNormals.push(normals[(parseInt(values1[2]) - 1)*3 + 1]);
					fixedNormals.push(normals[(parseInt(values1[2]) - 1)*3 + 2]);
					fixedNormals.push(normals[(parseInt(values3[2]) - 1)*3]);
					fixedNormals.push(normals[(parseInt(values3[2]) - 1)*3 + 1]);
					fixedNormals.push(normals[(parseInt(values3[2]) - 1)*3 + 2]);
					fixedNormals.push(normals[(parseInt(values4[2]) - 1)*3]);
					fixedNormals.push(normals[(parseInt(values4[2]) - 1)*3 + 1]);
					fixedNormals.push(normals[(parseInt(values4[2]) - 1)*3 + 2]);

					fixedIndices.push(count++);
					fixedIndices.push(count++);
					fixedIndices.push(count++);
					fixedIndices.push(count++);
					fixedIndices.push(count++);
					fixedIndices.push(count++);

					texturesGiven = true;
					normalsGiven = true;
				} 
			}
			if (renderType === "") {
				renderType = "faces";
			} 
		}
	});
	var normalsCreated = false;
	if (normals.length == 0) {
		for (var i = 0; i < selfNormalArray.length; i++) {
			var sumX = 0;
			var sumY = 0;
			var sumZ = 0;

			for (var j = 0; j < selfNormalArray[i].length; j++) {
				sumX += selfNormalArray[i][j][0];
				sumY += selfNormalArray[i][j][1];
				sumZ += selfNormalArray[i][j][2];
			}
			var avgX = sumX / selfNormalArray[i].length;
			var avgY = sumY / selfNormalArray[i].length;
			var avgZ = sumZ / selfNormalArray[i].length;

			var normalize = Math.sqrt(avgX*avgX + avgY*avgY + avgZ*avgZ);

			fixedNormals.push(avgX/normalize);
			fixedNormals.push(avgY/normalize);
			fixedNormals.push(avgZ/normalize);
		}
		normalsGiven = false;
		normalsCreated = true;
		fixedVertices = vertices;
	}

	vertices = new Float32Array(vertices);
	verticesIndex = new Uint16Array(verticesIndex);
	normals = new Float32Array(normals);
	normalsIndex = new Uint16Array(normalsIndex);
	textures = new Float32Array(textures);
	texturesIndex = new Uint16Array(texturesIndex);
	fixedVertices = new Float32Array(fixedVertices);
	fixedIndices = new Uint16Array(fixedIndices);
	fixedNormals = new Float32Array(fixedNormals);
	this.name = name;
	this.renderType = renderType;
	this.minY = minY;
	this.maxY = maxY;
	this.maxX = maxX;
	this.minX = minX;

    vertexBuffer = gl.createBuffer();
	indexBuffer = gl.createBuffer();
    normalBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    if (normalsGiven || texturesGiven) {
    	gl.bufferData(gl.ARRAY_BUFFER, fixedVertices, gl.STATIC_DRAW);
    } else {
    	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    }

    if (normalsGiven || normalsCreated) {
    	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    	gl.bufferData(gl.ARRAY_BUFFER, fixedNormals, gl.STATIC_DRAW);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    if (normalsGiven) {
    	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, fixedIndices, gl.STATIC_DRAW);
    } else {
    	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, verticesIndex, gl.STATIC_DRAW);
    }

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');

    var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');

	this.draw = function(gl) {

		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.drawElements(gl.TRIANGLES, fixedIndices.length, gl.UNSIGNED_SHORT, 0);
        gl.disable(gl.POLYGON_OFFSET_FILL);

	}

}
function faceFormatType(tokens) {
	if (tokens[1].indexOf("/") == -1) {		
		return 0;
	} else {	
		if (tokens[1].match(/\//g).length == 1) {		
			return 1;
		} else if (tokens[1].match(/\//g).length == 2) {	
			var indices = [];
			var str = tokens[1];
			for (var i = 0; i < str.length; i++) {
				if (str[i] === "/") {
					indices.push(i);
				}
			}
			if (indices[1] - indices[0] == 1) {				
				return 2;
			} else {										
				return 3;
			}
		} else {	
			return -1;
		}
	}
}

function error() {
	alert("Error found while parsing obj file, see console for more detailed error");
}

function display(gl, obj) {
	var xAxis = 0;
	var yAxis = 0;
	var zAxis = 0;
	
	var xTheta = 0;
	var yTheta = 0.1;
	var zTheta = 0;
	
	var flag = true;

    var projection  = perspective(90, 1, .1, 1000);
    gl.uniformMatrix4fv(gl.u_Projection, false, flatten(projection));

    var imageHeight = obj.maxY - obj.minY;
    var imageWidth = obj.maxX - obj.minX;

    var shift = translate(0, 0, 0);
    var transform = lookAt(vec3(imageWidth/2, imageHeight/2.0, imageHeight*0.75), vec3(0, 0, 0), vec3(0, 0.1,0));
    gl.uniformMatrix4fv(gl.u_ViewMatrix, false, flatten(transform));

    var g_last = Date.now();
    var count = 0;
    var angle = 0;
    const ANGLE_STEP = 30;
    var tick = function(){
        var now = Date.now();
        var elapsed = now - g_last;
        g_last = now;
        angle = angle + (ANGLE_STEP * elapsed) / 1000.0;
        
        document.getElementById("Button0").onclick = function(){xAxis += 0.1;};
        document.getElementById("Button1").onclick = function(){yAxis += 0.1;};
        document.getElementById("Button2").onclick = function(){zAxis += 0.1;};
		document.getElementById("Button3").onclick = function(){xTheta += 0.1;};
		document.getElementById("Button4").onclick = function(){yTheta += 0.1;};
		document.getElementById("Button5").onclick = function(){zTheta += 0.1;};
		document.getElementById("Button6").onclick = function(){imageWidth *= 0.5;};
		document.getElementById("Button7").onclick = function(){imageWidth /= 0.5;};
		var transform = lookAt(vec3(imageWidth/2, imageHeight/2.0, imageHeight*0.75), vec3(xAxis, yAxis, zAxis), vec3(xTheta, yTheta, zTheta));
		gl.uniformMatrix4fv(gl.u_ViewMatrix, false, flatten(transform));
        gl.uniformMatrix4fv(gl.u_ModelMatrix, false, flatten(mult(rotate(angle, 0,1,0), shift)));
		
        gl.clear(gl.COLOR_BUFFER_BIT |gl.DEPTH_BUFFER_BIT);
		gl.clearColor(0.7,0.5,0.7,1);
        obj.draw(gl);
        
       	requestAnimationFrame(tick);
		
    };
    tick();
}
function initializeTexture(gl, textureid, filename, uniform) {

    return new Promise(function(resolve, reject) {

        var texture = gl.createTexture();
        var image = new Image();
        var u_Sampler = gl.getUniformLocation(gl.program, uniform);

        image.onload = function() {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
            gl.activeTexture(gl.TEXTURE0 + textureid);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.uniform1i(u_Sampler, textureid);
            resolve();
        }

        image.onerror = function(error) {
            reject(Error(filename));
        }

        image.src = filename;

    })
}
