/** User class for message.ly */
const bcrypt = require('bcrypt')
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require('../config');
const db = require('../db');
const jwt = require("jsonwebtoken");
const ExpressError = require('../expressError')



/** User of the site. */

class User {

  constructor({username, password, first_name, last_name, phone, join_at = 0, last_login_at=0}) {
    this.username = username;
    this.password = password;
    this.firstName = first_name;
    this.lastName = last_name;
    this.phone = phone;
    this.joinedAt = join_at;
    this.lastLogin = last_login_at;
  }

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */
  static async register(username, password, first_name, last_name, phone) { 
    const hashedPW = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)
    const {rows} = await db.query(`INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, CURRENT_DATE) RETURNING username, password, first_name, last_name, phone, join_at, last_login_at`, [username, hashedPW, first_name, last_name, phone])

    const user = new User(rows[0])
    
    return user

  }

  /** Authenticate: is this username/password valid? Returns boolean. */
  static async authenticate(username, password) { 
    const {rows} = await db.query(`SELECT username, password FROM users WHERE username=$1`, [username])
    const user = rows[0]

    if (user) {
      if(await bcrypt.compare(password, user.password)) {
        let token = jwt.sign({username}, SECRET_KEY) // SECRET_KEY in config file
        this.updateLoginTimestamp(username)
        return {user: user.username, token}
      }
    }
    return false
  }

  /** Update last_login_at for user */
  static async updateLoginTimestamp(username) { 
    await db.query(`UPDATE users SET last_login_at = CURRENT_DATE WHERE username=$1`, [username])
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */
  static async all() { 
    const { rows } = await db.query(`SELECT username, first_name, last_name, phone FROM users`)
    return rows.map(u => new User(u));
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const {rows} = await db.query('SELECT * FROM users WHERE username=$1', [username])
    return rows[0]
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { 
    const {rows} = await db.query(`SELECT id, to_username, body, sent_at, read_at FROM messages WHERE from_username=$1`, [username])
    return rows
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) { 
    const {rows} = await db.query(`SELECT id, from_username, body, sent_at, read_at FROM messages WHERE to_username=$1`, [username])
    return rows
  }
}


module.exports = User;