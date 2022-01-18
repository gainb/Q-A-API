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
  let temp = {product_id: String(id)}
  let tempans = {};
  pool.connect()
  .then(client => {
    return client.query('SELECT question_id, question_body, question_date, asker_name, question_helpfulness, reported FROM questions WHERE product_id = $1 AND reported != 1 OFFSET $2 LIMIT $3', [id, (page-1)*count, count])
    .then(result => {
      result.rows.forEach(item => {
        if (item.reported) {
          item.reported = true;
        } else {
          item.reported = false;
        }
      })
      temp.results = result.rows;
      Promise.all(temp.results.map(quest => {
        return new Promise((resolve, reject) => {
          getA(1, 1000, quest.question_id, (err, answers) => {
            if (err) {
              reject(err);
            } else {
              quest.answers = {};
              answers.results.forEach(ans => {
                quest.answers[quest.question_id] = ans;
              })
              resolve(answers);
            }
          }, true)
        })
      }))
      .then(() => {
        client.release();
        callback(null, temp);
      })
      .catch(err => {
        client.release();
        callback(err);
      })
    })
    .catch(err => callback(err));
  })
}

let getA = (page, count, qid, callback, parent = false) => {
  let transres = {};
  transres.question = String(qid);
  transres.page = page;
  transres.count = count;
  let query = parent ? 'SELECT answer_id AS id, body, date, answerer_name, answerer_email, helpful FROM answers WHERE question_id = $1 AND reported != 1 OFFSET $2 LIMIT $3' : 'SELECT answer_id, body, date, answerer_name, answerer_email, helpful FROM answers WHERE question_id = $1 AND reported != 1 OFFSET $2 LIMIT $3'
  pool.connect()
  .then(client => {
    return client.query(query, [qid, (page-1)*count, count])
    .then(res => {
      transres.results = res.rows;
      Promise.all(res.rows.map(item => {
        return new Promise((resolve, reject) => {
          getAP(item.answer_id, (err, outcome) => {
            if (err) {
              reject(err);
            } else {
              transres.results.forEach(trans => {
                if (trans.answer_id === item.answer_id) {
                  trans.photos = outcome;
                  resolve(outcome);
                }
              })
              resolve(outcome);
            }
          })
        })
      }))
      .then(() => callback(null, transres))
      .catch(err => callback(err))
    })
    .catch(err => {
      client.release()
      callback(err);
    })
  })
}

let getAP = (aid, callback) => {
  pool.connect()
  .then( client => {
    return client.query('SELECT url FROM answers_photos WHERE answer_id = $1', [aid])
    .then(result => {
      client.release()
      callback(null, result.rows)
    })
    .catch(err => {
      callback(err);
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