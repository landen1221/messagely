const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const User = require("../models/user");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
**/
router.post('/login', async (req, res, next) => {
    try {
        const {username, password } = req.body;
        
        if(!username || !password) {
            throw new ExpressError("All fields required", 400)
        }

        const user = await User.authenticate(username, password)
    
        if(!user.user) {
            throw new ExpressError("invalid credentials", 400)
        }

        return res.json(user);

    } catch (e) {
        return next(e);
    }
});


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post('/register', async (req, res, next) => {
    try {
        const {username, password, first_name, last_name, phone } = req.body;
        
        if(!username || !password || !first_name || !last_name || !phone) {
            throw new ExpressError("All fields required", 400)
        }

        const user = await User.register(username, password, first_name, last_name, phone)
        return res.send({ Registered: user });
    } catch (e) {
        if (e.code === '23505'){
            return next(new ExpressError("User taken. Please pick another.", 400))
          }
        return next(e);
    }
});


module.exports = router;