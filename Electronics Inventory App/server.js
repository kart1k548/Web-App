if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const express = require('express')
const app = express()
const mustacheExpress = require('mustache-express');
const bcrypt = require('bcrypt')
const mustache = mustacheExpress();
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const { Client } = require('pg');
const initializePassport= require('./passport-config');
initializePassport(
  passport,
  email => users.find(user => user.email1 === email),
  id => users.find(user => user.id === id)
)
var users = []
app.engine('mustache', mustache);
app.set('view engine','mustache');
app.set('view-engine', 'ejs');

app.use(express.urlencoded({ extended: false }))
app.use(express.static('public'));
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))
app.get('/admin/register', checkNotAuthenticatedAdmin, (req, res) => {
  res.render('sign-up-page-admin.ejs')
})

app.get('/seller/register', checkNotAuthenticatedSeller, (req, res) => {
  res.render('sign-up-page-seller.ejs')
})

app.get('/viewer/register', checkNotAuthenticatedViewer, (req, res) => {
  res.render('sign-up-page-viewer.ejs')
})

app.post('/admin/register', checkNotAuthenticatedAdmin, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      name1: req.body.name,
      email1: req.body.email,
      password: hashedPassword
    })
    res.redirect('/admin/login')
  } catch {
    res.redirect('/admin/register')
  }
})

app.post('/viewer/register', checkNotAuthenticatedViewer, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      name1: req.body.name,
      email1: req.body.email,
      password: hashedPassword
    })
    res.redirect('/viewer/login')
  } catch {
    res.redirect('/viewer/register')
  }
})

app.post('/seller/register', checkNotAuthenticatedSeller, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      name1: req.body.name,
      email1: req.body.email,
      password: hashedPassword
    })
    const client = new Client({
      user: 'postgres',
      host: 'localhost',
      database: 'ampius',
      password: 'test123',
      port: 5432,
  });
  client.connect()
  .then(()=>{
      console.log('Connection Complete');
      const sql = 'INSERT INTO users (sname,email) VALUES ($1, $2)';
      const params = [req.body.name,req.body.email];
      return client.query(sql,params);
  })
    res.redirect('/seller/login')
  } catch {
    res.redirect('/seller/register')
  }
})
app.get('/admin', checkAuthenticatedAdmin,(req, res) => {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'ampius',
    password: 'test123',
    port: 5432,
});
client.connect()
    .then(()=>{
        console.log('connection success');
       return client.query('SELECT * FROM users LEFT JOIN items on users.uid = items.uid');
    })
    .then((results)=>{
        console.log('results?',results);
       res.render('admin.mustache',results);
    });
});

app.get('/admin/login', checkNotAuthenticatedAdmin, (req, res) => {
  res.render('loginpage-admin.ejs')
})

app.get('/seller/login', checkNotAuthenticatedSeller, (req, res) => {
  res.render('loginpage-seller.ejs')
})

app.get('/viewer/login', checkNotAuthenticatedViewer, (req, res) => {
  res.render('loginpage-viewer.ejs')
})

app.post('/admin/login', checkNotAuthenticatedAdmin, passport.authenticate('local', {
  successRedirect: '/admin',
  failureRedirect: '/admin/login',
  failureFlash: true
}))

app.post('/seller/login', checkNotAuthenticatedSeller, passport.authenticate('local', {
  successRedirect: '/seller',
  failureRedirect: '/seller/login',
  failureFlash: true
}))

app.post('/viewer/login', checkNotAuthenticatedViewer, passport.authenticate('local', {
  successRedirect: '/viewer',
  failureRedirect: '/viewer/login',
  failureFlash: true
}))

app.get('/viewer', checkAuthenticatedViewer, (req, res) => {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'ampius',
    password: 'test123',
    port: 5432,
});
client.connect()
    .then(()=>{
        console.log('connection success');
       return client.query('SELECT * FROM items');
    })
    .then((results)=>{
        console.log('results?',results);
       res.render('viewer.mustache',results);
    });
});

app.get('/seller', checkAuthenticatedSeller, (req, res) => {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'ampius',
    password: 'test123',
    port: 5432,
});
client.connect()
    .then(()=>{
        console.log('connection success');
       return client.query('SELECT * FROM items');
    })
    .then((results)=>{
        console.log('results?',results);
       res.render('seller.mustache',results);
    });
});

app.get('/seller/add',checkAuthenticatedSeller, (req,res)=>{
  res.render('selleradd.mustache');
});

app.post('/seller/add',checkAuthenticatedSeller, (req,res)=>{
  const client = new Client({
      user: 'postgres',
      host: 'localhost',
      database: 'ampius',
      password: 'test123',
      port: 5432,
  });
  client.connect()
  .then(()=>{
      console.log('Connection Complete');
      const sql = 'INSERT INTO items (uid,iname,brand,count) VALUES ($1, $2, $3, $4)';
      const params = [req.body.uid,req.body.name,req.body.brand,req.body.count];
      return client.query(sql,params);
  })
  .then((result)=>{
      console.log('results?',result);
      res.redirect('/seller');
  });
});

app.get('/seller/edit/:id',checkAuthenticatedSeller, (req,res)=>{
  const client = new Client({
      user: 'postgres',
      host: 'localhost',
      database: 'ampius',
      password: 'test123',
      port: 5432,
  });
  client.connect()
  .then(()=>{
     const sql = 'SELECT * FROM items WHERE itid=$1'
     const params = [req.params.id];
     return client.query(sql,params);
  })
  .then((results)=>{
      console.log('results?',results)
      res.render('seller-edit.mustache',{item:results.rows[0]});
  });
});

app.post('/seller/edit/:id',checkAuthenticatedSeller,(req,res)=>{
  const client = new Client({
      user: 'postgres',
      host: 'localhost',
      database: 'ampius',
      password: 'test123',
      port: 5432,
  });
  client.connect()
  .then(()=>{
     const sql = 'UPDATE items SET uid=$1, name=$2, brand=$3, count=$4 WHERE itid=$5'
     const params = [req.body.uid,req.body.name,req.body.brand,req.body.count,req.params.id];
     return client.query(sql,params);
  })
  .then((results)=>{
      console.log('results?',results)
      res.redirect('/seller');
  });
});

app.post('/seller/delete/:id', (req,res)=>{
  const client = new Client({
      user: 'postgres',
      host: 'localhost',
      database: 'ampius',
      password: 'test123',
      port: 5432,
  });
  client.connect()
  .then(()=>{
     const sql = 'DELETE FROM items WHERE itid = $1';
     const params = [req.params.id];
     return client.query(sql,params);
  })
  .then((results)=>{
      res.redirect('/seller');
  });
});

app.delete('/admin/logout', (req, res) => {
  req.logOut()
  res.redirect('/admin/login')
})

app.delete('/seller/logout', (req, res) => {
  req.logOut()
  res.redirect('/seller/login')
})

app.delete('/viewer/logout', (req, res) => {
  req.logOut()
  res.redirect('/viewer/login')
})

function checkAuthenticatedAdmin(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/admin/login')
}

function checkAuthenticatedSeller(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/seller/login')
}

function checkAuthenticatedViewer(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/viewer/login')
}
function checkNotAuthenticatedAdmin(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/admin')
  }
  next()
}

function checkNotAuthenticatedSeller(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/seller')
  }
  next()
}

function checkNotAuthenticatedViewer(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/viewer')
  }
  next()
}

app.listen(5002,()=>{
  console.log('listening to port 5002');
});