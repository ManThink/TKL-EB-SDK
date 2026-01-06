# Upgrade Content / Release Notes:
## 3.01.001 
1.  Added UpAfterQueryEvent: This event is triggered immediately after a query operation completes to enable instant event propagation.
2.  Enhanced EBExpr with Absolute Value Function: Introduced a new absolute value function for numerical operations in EB expressions.
3.  Extended Conditional Configuration: Added a pre flag to both copyCond and cvtCond configurations, allowing queryEvent to perform conditional checks and operations before the main query execution.
4.  Upgraded filterMask Validation Logic: Enforced mandatory validation of the software version (swVersion) during device firmware upgrade processes.
5.  Fixed Large File Processing Issue: Resolved a bug where output binary files (obin) failed to generate when the source binary file size exceeded 1KB.
6.  Added Built-in Utility Function: Integrated the setupCov function.
7.  Optimized QueryEvent's ifSelect Logic: Added a no_query parameter. When set, this parameter skips the query and directly executes the subsequent defined actions.
8.  Add a copy method to EBbuffer.
9.  Remove HwType and UpgradeType from the ontConfig in the example.

## 3.01.002
1. Throw an exception when the binary file size exceeds 2KB (2048 bytes).
2. Optimize exception handling during .obin file construction.