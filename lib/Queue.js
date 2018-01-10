/**
 * Very basic implementation of a Queue data structure with enqueue and dequeue
 * methods.
 */
class Queue {
  constructor() {
    this.stack1 = [];
    this.stack2 = [];
    this.length = 0;
  }

  enqueue(...values) {
    this.stack1.push(...values);
    this.length += values.length;
    return this.length;
  }

  dequeue() {
    if (this.length === 0) return;
    const { stack1, stack2 } = this;

    if (stack2.length === 0) {
      while (stack1.length > 0) {
        stack2.push(stack1.pop());
      }
    }

    this.length -= 1;
    return stack2.pop();
  }
}

module.exports = Queue;
