let path=require("path");
let fastify=require("fastify")({ logger: false });
let fastifyStatic=require("@fastify/static");
let fastifyCompress=require("@fastify/compress");
let PORT=6008;
let publicDir=path.join(__dirname, "/public");
fastify.register(fastifyCompress);
fastify.register(fastifyStatic,{
    root: publicDir,
    prefix: "/",
    maxAge: 0,
    immutable: false,
    etag: false,
    lastModified: false,
    setHeaders(res, path, stat){
        res.setHeader("Cache-Control", "no-store");
    }
});
fastify.setNotFoundHandler((request, reply)=>{
    reply.code(404).type("text/plain").send("404 Not Found");
});
fastify.setErrorHandler((error, request, reply)=>{
    request.log.error(error);
    reply.code(500).type("text/plain").send(`Server error: ${error.message}`);
});
let start=async ()=>{
    try{
        await fastify.listen({ port: PORT, host: "::" });
        console.log(`Server running at http://localhost:${PORT}`);
    }
    catch (err){
        process.exit(1);
    }
};
start();
