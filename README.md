## @pflow-dev/metamodel

Create state-machines using [Petri-Nets](http://www.scholarpedia.org/article/Petri_net) in Javascript/Typescript.

Models of this type can range in power from [DFA's](https://en.wikipedia.org/wiki/Deterministic_finite_automaton#Example) to [Turing complete](https://www.quora.com/Why-is-an-inhibitor-arc-necessary-for-a-PetriNet-to-be-Turing-complete-What-kind-of-system-cant-be-represented-without-it) automata.


#### Installation

Typescript: use this file in your project https://github.com/pFlow-dev/metamodel-js/blob/master/src/metamodel.ts

or

Javascript: use this file in your project https://github.com/pFlow-dev/metamodel-js/blob/master/src.browser/metamodel.js


### Applications

* https://pflow.dev/editor - Interactive graphical editor that can export models compatible with this library.
 
###  Theory

What is a Petri-Net?
* Introduction and Explanation: [Petri-Nets on Scholar-pedia](http://www.scholarpedia.org/article/Petri_net)
* More background: from a 'Computational Thinking' course [Petri-Net Notes]( https://people.cs.vt.edu/kafura/ComputationalThinking/Class-Notes/Petri-Net-Notes-Expanded.pdf)

#### Automata Theory

FSM vs Petri-Net: What's the difference?

```
A finite state machine can be considered as a special case of a Petri net.
A finite state machine is single threaded while a Petri net is concurrent.
```
* stack-overflow: [Finite state machines vs Petri-Net](https://stackoverflow.com/questions/53980748/whats-the-difference-of-petri-nets-and-finite-state-machines)
* wikipedia: [Finite state machine](https://en.wikipedia.org/wiki/Finite-state_machine)

#### Category Theory

```
Petri nets generate free symmetric monoidal categories
```

* wikipeida: [monoids](https://en.wikipedia.org/wiki/Monoid#Relation_to_category_theory)
* ncatlab:  [petri-net](https://ncatlab.org/nlab/show/Petri+net#introduction)
* hacker news: [Petri-Nets are monoids](https://news.ycombinator.com/item?id=22242358)


#### Information theory

* An information theoretic approach
for [knowledge representation using Petri-nets](https://strathprints.strath.ac.uk/65430/1/Chiachio_etal_FTC_2017_An_information_theoretic_approach_for_knowledge_representation_using_Petri_nets.pdf)
