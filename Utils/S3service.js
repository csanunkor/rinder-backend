const aws = require('aws-sdk');

class S3service {

    removeS3Object = async (key, callback) => {        
        const s3 = new aws.S3({
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            region: process.env.S3_BUCKET_REGION
        });
        
        var params = {
        Bucket: "rinder-images",
        Key: key,
        };
    
    
        s3.deleteObject(params, function(err, data) {
            if (err) {
                console.warn("s3 error: ", err);
                return err; 
            }
            return callback();
        });
    }

    uploadS3Object = async (key, file, callback) => {
        
        const s3 = new aws.S3({
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        region: process.env.S3_BUCKET_REGION
        });  
    
        var params = {
        Bucket: "rinder-images",
        Key: key,
        Body: file.data,
        ContentType: file.mimetype,
        ACL: "public-read"
        };
      
        s3.upload(params, async function(err, data) {
            if (err) {
                console.warn("error:", err);
                return res.status(500).json({error: true, Message: err });
            }
            return callback(data);
        });
    }
}


module.exports = new S3service(); 