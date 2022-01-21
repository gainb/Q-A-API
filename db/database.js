const { Pool, Client } = require('pg');


const pool = new Pool({
  host: 'sdcdb-instance-1.cucdyuzurcan.us-east-1.rds.amazonaws.com',
  user: 'gainb',
  password: 'cnv7jnr0CVC6zur_jzm',
  database: 'postgres',
  post: 5432
})


const client = new Client({
  host: 'sdcdb-instance-1.cucdyuzurcan.us-east-1.rds.amazonaws.com',
  user: 'gainb',
  password: 'cnv7jnr0CVC6zur_jzm',
  database: 'postgres',
  post: 5432
})

client
  .connect()
  .then(() => console.log('connected'))
  .catch(err => console.log('error connecting to db: ', err));

let getQ = (page, count, id, callback) => {
  let output = {};
  output.product_id = String(id);
  pool.connect()
  .then(client => {
    return client.query("SELECT questions.question_id, question_body, question_date, asker_name, question_helpfulness, questions.reported::boolean, COALESCE(json_object_agg(answers.answer_id, json_build_object('id', answers.answer_id, 'body', body, 'date', date, 'answerer_name', answerer_name, 'helpfulness', helpful, 'photos', ARRAY(select url from answers_photos where answers_photos.answer_id = answers.answer_id))) FILTER (where answers.answer_id is not null), '{}') as answers FROM questions LEFT JOIN answers ON questions.question_id = answers.question_id WHERE questions.product_id = $1 AND questions.reported != 1 GROUP BY questions.question_id OFFSET $2 LIMIT $3", [id, (page-1)*count, count])
    .then(results => {
      client.release();
      output.results = results.rows
      callback(null, output);
    })
    .catch(err => {
      client.release();
      callback(err);
    })
  })
}

let getA = (page, count, qid, callback) => {
  let transres = {};
  transres.question = String(qid);
  transres.page = page;
  transres.count = count;
  pool.connect()
  .then(client => {
    return client.query('SELECT answer_id, body, date, answerer_name, answerer_email, helpful, ARRAY(select url from answers_photos where answers_photos.answer_id = answers.answer_id) as photos FROM answers WHERE question_id = $1 AND reported != 1 OFFSET $2 LIMIT $3', [qid, (page-1)*count, count])
    .then(results => {
      client.release();
      transres.results = results.rows;
      callback(null, transres);
    })
    .catch(err => {
      client.release();
      callback(err)
    })
  })
}

let postQ = (body, name, email, product_id, callback) => {
  let date = new Date();
  pool.connect()
  .then(client => {
    return client.query('INSERT INTO questions (product_id, question_body, question_date, asker_name, asker_email) VALUES ($1, $2, $3, $4, $5)', [product_id, body, date, name, email])
    .then(result => {
      client.release();
      callback(null, result);
    })
    .catch(err => {
      client.release();
      callback(err);
    })
  })
}

let postA = (body, name, email, photos, question_id, callback) => {
  let date = new Date();
  pool.connect()
  .then(client => {
    return client.query('INSERT INTO answers (question_id, answerer_name, answerer_email, body, date) VALUES ($1, $2, $3, $4, $5) RETURNING *', [question_id, name, email, body, date])
    .then(result => {
      photos.map(photo => {
        return new Promise((resolve, reject) => {
          client.query('INSERT INTO answers_photos (answer_id, url) VALUES ($1, $2)', [result.rows[0].answer_id, photo])
        .then(outcome => {
          resolve(outcome);
        })
        .catch(err => {
          reject(err);
        })
        })
      })
      Promise.all(photos)
      .then(res => {
        client.release();
        callback(null, res);
      })
      .catch(err => callback(err));
    })
  })
}

let helpQ = (qid, callback) => {
  pool.connect()
  .then(client => {
    return client.query('UPDATE questions SET question_helpfulness = question_helpfulness + 1 WHERE question_id = $1', [qid])
    .then(res => {
      client.release();
      callback(null, res);
    })
    .catch(err => {
      client.release();
      callback(err);
    });
  })
}

let reportQ = (qid, callback) => {
  pool.connect()
  .then(client => {
    return client.query('UPDATE questions SET reported = 1 WHERE question_id = $1 AND reported = 0', [qid])
    .then(res => {
      client.release()
      callback(null, res)
    })
    .catch(err => {
      client.release()
      callback(err);
    })
  })
}

let helpA = (aid, callback) => {
  pool.connect()
  .then(client => {
    return client.query('UPDATE answers SET helpful = helpful + 1 WHERE answer_id = $1', [aid])
    .then(res => {
      client.release();
      callback(null, res);
    })
    .catch(err => {
      client.release();
      callback(err)
    });
  })
}

let reportA = (aid, callback) => {
  pool.connect()
  .then(client => {
    return client.query('UPDATE answers SET reported = 1 WHERE answer_id = $1 AND reported = 0', [aid])
    .then(res => {
      client.release()
      callback(null, res)
    })
    .catch(err => {
      client.release()
      callback(err);
    })
  })
}

let getAP = (aid, callback) => {
  pool.connect()
  .then(client => {
    return client.query('SELECT url FROM answers_photos WHERE answer_id = $1', [aid])
    .then(result => {
      client.release()
      callback(null, result.rows[0])
    })
    .catch(err => {
      callback(err);
    })
  })
}

module.exports = {
  getQ,
  getA,
  getAP,
  postQ,
  postA,
  helpQ,
  helpA,
  reportQ,
  reportA
}