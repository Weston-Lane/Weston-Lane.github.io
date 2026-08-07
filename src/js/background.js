import fragShader from '../backgroundAssets/background.fs?raw'
import vertShader from '../backgroundAssets/background.vs?raw'

export function InitBackground()
{
    const canvas = document.createElement('canvas');
    canvas.id = 'bg-canvas';
    
    const body = document.querySelector('body');
    body.appendChild(canvas);
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const gl = canvas.getContext('webgl2');
    if(!gl)
        { console.error('no web gl context'); }

    const vertexSource = vertShader;
    const fragmentSource = fragShader;
    
    const vertexShader = CreateShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = CreateShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    const program = CreateProgram(gl, vertexShader, fragmentShader);

    const posAttrLoc = gl.getAttribLocation(program, "a_pos");

    const posBuff = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuff);

    const vertices = [
        1, -1,
        -1, -1,
        -1, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.viewport(0,0,gl.canvas.width, gl.canvas.height);
    
    gl.clearColor(0,0,0,0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.enableVertexAttribArray(posAttrLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuff);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer

    gl.vertexAttribPointer(posAttrLoc, size, type, normalize, stride, offset);

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 3;
    gl.drawArrays(primitiveType, offset, count);


}

 
function CreateShader(gl, type, source)
{
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);   

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if(success)
        { return shader; }
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function CreateProgram(gl, vertexShader, fragmentShader)
{
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if(success)
        { return program; }
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}