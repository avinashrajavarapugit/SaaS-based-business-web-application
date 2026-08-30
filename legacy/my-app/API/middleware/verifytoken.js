const f=require('jsonwebtoken')

const verifytoken=(request,response,next)=>{
const bearertoken=request.headers.authorization;
if(bearertoken===undefined)  //token doest exist
{
    response.send({message:"login first you are unauthorized user"})
}
else{       //if token exist
    //get token fron Bearer token
    const token=bearertoken.split(" ")[1]
    try{
    //verify it
jwt.verify(token,"abdjband");
next();
}

catch(err)
{
next(new Error("session expired please relogin"))   // forward to err handling middleware
}
}
}
module.exports=verifytoken
