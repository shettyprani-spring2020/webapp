let models = require("../models");
let owasp = require('owasp-password-strength-test');
let db = require("../database/UserDb");
let email_validator = require("email-validator");

// Number of keys for new user should be 4
numOfKeys = (post, num) =>{
    if(Object.keys(post).length != num){
        return true;
    }
    return false;
}

// Should have all the required fields
missingKeys = (post, check) =>{
    let keys = Object.keys(post);
    for(key of keys){
        if(!check.includes(key)){
            return true;
        }
    }
    return false;
}

passwordStrength = (password) =>{
    let result = owasp.test(password);
    if(!result.strong){
        return result.errors;
    }
    return true;
}

emailValidator =(email_address)=>{
    return email_validator.validate(email_address);
}

emailExists =  async (email_address) =>{
    let result  = await db.findAll("email_address", email_address).then((result)=>{
        return result;
    });
    if(result.length != 0){
        return true;
    }
    return false;
}

main = async (post) =>{
    console.log("Validating");
    if(numOfKeys(post, 4)){
        return "Incorrect number of keys";
    }else if(missingKeys(post, ["email_address", "password","first_name","last_name"])){
        return "Missing keys";
    }else if(Array.isArray(passwordStrength(post.password))){
        return passwordStrength(post.password);
    }else if(!emailValidator(post.email_address)){
        return "Invalid email";
    }else if(await emailExists(post.email_address)){
        return "Email address already in use";
    }else{
        return "Passed";
    }

}
module.exports =  {
    numOfKeys,
    missingKeys,
    passwordStrength,
    emailValidator,
    emailExists,
    main
};