const express = require('express');
const router = express.Router();
const db = require('./database.js');

router.get('/questions', (req, res) => {
  const page = req.query.page || 1;
  const count = req.query.count|| 5;
  const id = req.query.product_id;
  db.getQ(page, count, id, (err, response) => {
    if (err) {
      res.status(404).send(err)
    } else {
      res.send(response);
    }
  });
});

router.get('/questions/:question_id/answers', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const count = parseInt(req.query.count) || 5;
  const id = parseInt(req.params.question_id);
  db.getA(page, count, id, (err, response) => {
    if (err) {
      res.status(404).send(err)
    } else {
      res.send(response);
    }
  })
});

router.post('/questions', (req, res) => {
  const { body, name, email, product_id } = req.body;
  db.postQ(body, name, email, product_id, (err, response) => {
    if (err) {
      res.status(404).send(err);
    } else {
      res.status(201).send('CREATED');
    }
  })
})

router.post('/questions/:question_id/answers', (req, res) => {
  const qid = req.params.question_id;
  const { body, name, email, photos } = req.body;
  db.postA(body, name, email, photos, qid, (err, response) => {
    if (err) {
      res.status(404).send(err)
    } else {
      res.status(201).send('CREATED');
    }
  })
})

router.put('/questions/:question_id/helpful', (req, res) => {
  const qid = req.params.question_id;
  db.helpQ(qid, (err, resp) => {
    if (err) {
      res.status(404).send(err)
    } else {
      res.status(204).send(resp)
    }
  })
})

router.put('/answers/:answer_id/helpful', (req, res) => {
  const aid = req.params.answer_id;
  db.helpA(aid, (err, resp) => {
    if (err) {
      res.status(404).send(err)
    } else {
      res.status(204).send(resp)
    }
  })
})

router.put('/questions/:question_id/report', (req, res) => {
  const qid = req.params.question_id;
  db.reportQ(qid, (err, resp) => {
    if (err) {
      res.status(404).send(err)
    } else {
      res.status(204).send(resp)
    }
  })
})

router.put('/answers/:answer_id/report', (req, res) => {
  const aid = req.params.answer_id;
  db.reportA(aid, (err, resp) => {
    if (err) {
      res.status(404).send(err)
    } else {
      res.status(204).send(resp)
    }
  })
})

module.exports = router;