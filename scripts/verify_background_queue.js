const { backgroundQueue } = require('../server/utils/queue');

console.log('🧪 Starting Background Queue processing verification...');

async function testSuite() {
  try {
    // 1. Enqueue Job 1: Newsletter Send
    console.log('\n[1/3] Enqueuing async newsletter dispatch job...');
    const job1 = await backgroundQueue.add('SEND_EMAIL_NEWSLETTER', { recipientCount: 450 });
    console.log(`  Enqueued job status: ${job1.status}`);
    
    if (job1.status !== 'queued' && job1.status !== 'processing') {
      throw new Error('Assertion Failed: Job status should start in queued or processing state');
    }

    // 2. Enqueue Job 2: Margin Snapshots
    console.log('\n[2/3] Enqueuing async analytics calculation job...');
    const job2 = await backgroundQueue.add('GENERATE_ANALYTICS_SNAPSHOT', { organizationId: 'org-test-111' });

    // 3. Wait for queue execution completion
    console.log('\n[3/3] Waiting for queue to clear asynchronously...');
    await new Promise((resolve) => {
      backgroundQueue.on('completed', (job) => {
        if (job.id === job2.id) {
          resolve();
        }
      });
    });

    const status1 = backgroundQueue.getJobStatus(job1.id);
    const status2 = backgroundQueue.getJobStatus(job2.id);

    console.log(`  Job 1 Final Status: ${status1.status}`);
    console.log(`  Job 2 Final Status: ${status2.status}`);

    if (status1.status !== 'completed' || status2.status !== 'completed') {
      throw new Error('Assertion Failed: All jobs should be completed');
    }

    console.log('\n🏆 ALL BACKGROUND QUEUE TESTS PASSED!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Background Queue Verification Failed:', error.message);
    process.exit(1);
  }
}

testSuite();
