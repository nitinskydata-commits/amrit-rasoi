const { EventEmitter } = require('events');

class JobQueue extends EventEmitter {
  constructor() {
    super();
    this.jobs = [];
    this.processing = false;
    this.handlers = new Map();
  }

  // Register job handler
  define(jobType, handler) {
    this.handlers.set(jobType, handler);
  }

  // Enqueue job details
  async add(jobType, data) {
    const job = {
      id: Math.random().toString(36).substring(2, 9),
      type: jobType,
      data,
      status: 'queued',
      createdAt: new Date()
    };
    
    this.jobs.push(job);
    console.log(`📥 [JobQueue] Enqueued job ${job.id} of type [${jobType}]`);
    
    // Trigger queue processing asynchronously
    setImmediate(() => this.process());
    return job;
  }

  // Process next job in line
  async process() {
    if (this.processing || this.jobs.length === 0) return;

    this.processing = true;
    const job = this.jobs.find(j => j.status === 'queued');

    if (!job) {
      this.processing = false;
      return;
    }

    job.status = 'processing';
    job.startedAt = new Date();
    
    console.log(`⚙️ [JobQueue] Processing job ${job.id} [${job.type}]...`);

    const handler = this.handlers.get(job.type);
    if (!handler) {
      job.status = 'failed';
      job.error = `No handler defined for type: ${job.type}`;
      console.error(`❌ [JobQueue] Failed job ${job.id}: ${job.error}`);
      this.processing = false;
      setImmediate(() => this.process());
      return;
    }

    try {
      await handler(job.data);
      job.status = 'completed';
      job.completedAt = new Date();
      console.log(`✅ [JobQueue] Completed job ${job.id} in ${job.completedAt - job.startedAt}ms`);
      this.emit('completed', job);
    } catch (err) {
      job.status = 'failed';
      job.error = err.message;
      console.error(`❌ [JobQueue] Error processing job ${job.id}:`, err.message);
      this.emit('failed', job, err);
    } finally {
      this.processing = false;
      // Continue to next job
      setImmediate(() => this.process());
    }
  }

  // Check status of a job
  getJobStatus(jobId) {
    return this.jobs.find(j => j.id === jobId) || null;
  }
}

const backgroundQueue = new JobQueue();

// Register Default Background Handlers
backgroundQueue.define('SEND_EMAIL_NEWSLETTER', async (data) => {
  console.log(`✉️ [Background Worker] Dispatching newsletter to ${data.recipientCount} subscribers...`);
  // Simulate heavy SMTP overhead
  await new Promise(resolve => setTimeout(resolve, 100));
});

backgroundQueue.define('GENERATE_ANALYTICS_SNAPSHOT', async (data) => {
  console.log(`📊 [Background Worker] Recalculating financial margins for Org: ${data.organizationId}`);
  await new Promise(resolve => setTimeout(resolve, 150));
});

module.exports = {
  backgroundQueue
};
