---
layout: post
title: Exploring Options in Javascript/TypeScript
date: 2017-05-07T00:36:20-07:00
comments: true
categories: typescript options
---

## Why TypeScript and Options

For the past few years at [SigFig](www.sigfig.com) we have been using [TypeScript](http://www.typescriptlang.org/), it makes refactoring
and working with a large code base/large team a lot more simple. A large variety of bugs
can be caught during the build phase allowing [CI](https://en.wikipedia.org/wiki/Continuous_integration)
to reject the pull request. Another great tool--and the subject of this post--has been our Option library.
The build will break if you try and use a value that may be undefined without unwrapping it, or if an method signature
was changed and some callers are incorrectly using it.

Options allow for a stricter api, and ensure the user is ready for null return values. They also keep with the
traditional iterator apis, which allows for nice [polymorphism](https://en.wikipedia.org/wiki/Polymorphism_(computer_science))
and a consistent functional programming approach.
You can think of an option similarly to an array with 0 or 1 value. You can then either map over the value, forEach
it, and even check if it contains a value. While we don't have to worry about methods throwing exception when empty
like in many other languages, it is still use full in javascript when dealing with undefined returned values.

Languages like [Scala](https://www.scala-lang.org/api/current/scala/Option.html),
who treat Options as first class, for example would return options for the following
similar javascript methods:

```js
Array.prototype.pop // See List.tailOption
Array.prototype.find // See List.find
Object[Key] // See Map.get
```

This requires the caller to "unwrap" the option if they want to use it and always be prepared to handle the null
possibility.

Method signatures will also often require options to allow for cleaner internal code. If a parameter is optional
it will be an option and the internal code can handle it with a more functional approach instead of `if` statements. The
biggest advantage here is if someone modifies this internal code they will not make the mistake of using an optional
parameter without checking its availability first.

For more information on scala options check out this guide to [The Option Type](http://danielwestheide.com/blog/2012/12/19/the-neophytes-guide-to-scala-part-5-the-option-type.html).

## The cs-options Library

If you would like to include an options library in your code `cs-options` can be included with `bower install cs-option`
or `npm install cs-option` package and require Option via `import {Option} from 'cs-option'`. Check out the readme on
[GitHub](https://github.com/CodySchaaf/CsOption).

I have come up with some pretty contrived examples--about a family and their pet--that I will go over one at a time to discus the different methods, followed
by the entire example at the <a href="#entire-example" class="link">bottom of this page</a> in both javascript and typescript. The examples will be in TypeScript
since the options library really shines when it is used with strict typing and reads very similar to javascript, but they will be paired with some javascript repls
so you can play with them yourself.

## How to make an Option

You can make an option from an existing value with `Option.fromNullable` or `Option.of`, and you can make
an empty option with `Option.absent`

<div data-toggle-RunKit>
```js
const Option = require('cs-option');

const arr = [1]

const options = {
    optionA: Option.fromNullable(arr.pop()),
    optionB: Option.fromNullable(arr.pop()),
    optionC: Option.of(1),
    optionD: Option.absent()
}

```
</div>


The method `fromNullable` is typically used to wrap an external method call which returns an untrusted value
(possibly null). In my example I will use it when popping an element from an array, but could also be paired
with find, or when reading a value from a map. In this example I want to feed one of my animals and need to
get food, I want to pop this off the food array so I wrap it in `Option.fromNullable`.

```ts
 getFood(): Option<number> {
    return Option.fromNullable(this.food.pop()); // or Option.pop(this.food)
  }
```

The method `of` is used when you need to wrap a known value in an option. It will throw an error if the value is undefined.
In my example I use this to pass a known value to a method that expects an option (since a family might or might not have a pet).
This is because the parameter is optional, but makes the internal logic simpler when this is an option, as well as when the attribute is
read it is clear that it could be empty.

```ts

class Family {
  constructor(public pet: Option<Pet>) {}
}

new Family(Option.of(blueTheCat));

```

Finally an empty option can be created with `absent`, and should be used in the above example when you don't have a value to
pass to a method, or assign an attribute.

```ts
new Family(Option.absent());
```

##Working With Options

Coming Soon...

## Full Example

<div data-toggle id="entire-example"></div>
<div data-toggle-TS-JS>

```ts
import {Option} from 'cs-option';

class PetType {
  static readonly DOG = 'DOG';
  static readonly CAT = 'CAT';
}

class Pet {
  type: PetType;

  private energy = [] as number[];

  constructor(public name: string) {}

  eat(food: number) {
    this.energy.push(food);
  }
}

const blueTheCat = new Pet('Blue');
class Family {
  private food = [1, 1, 1, 1];
  private secretStash = 1;

  constructor(public pet: Option<Pet>) {

  }

  feedCats() {
    this.pet
      .filter(pet => pet.type === PetType.CAT)
      .forEach(this.feedPet.bind(this));
  }

  callPet() {
    console.log(this.pet.map(p => p.name));
  }

  feedBlue() {
    this.pet
      .filterValue(blueTheCat)
      .forEach(this.feedPet.bind(this));
  }

  feedNotBlue() {
    this.pet
      .filterNotValue(blueTheCat)
      .forEach(this.feedPet.bind(this));
  }

  getFood(): Option<number> {
    return Option.fromNullable(this.food.pop()); // or Option.pop(this.food)
  }

  getFoodOrSecretStashFood(): Option<number> {
    return this.getFood().orElse(Option.of(this.secretStash));
  }

  buyFood() {
    // decrement money
    return 1;
  }

  feedPet(pet: Pet) {
    // example feed 1
    pet.eat(this.getFood().orThrow('No more food'));
    // example feed 2
    pet.eat(this.getFood().orCall(this.buyFood));
    // example feed 3
    pet.eat(this.getFood().or(this.secretStash));
    // example feed 4 not preferred since it is not as functional, but in certain instances can be helpful
    const food = this.getFood();
    if (food.isPresent()) { // or !food.isAbsent()
      pet.eat(food.get()); // will throw if empty
    } else {
      pet.eat(this.secretStash);
    }
  }

  hasCat(): boolean {
    return this.pet.exists(p => p.type === PetType.CAT);
  }

  hasBlue(): boolean {
    return this.pet.contains(blueTheCat);
  }
}

class Groomer {
  private waitingRoom = [new Family(Option.of(blueTheCat))];
  private kennel = [blueTheCat, new Pet('Merlin')];

  groomPetFromWaitingRoom() {
    Option.pop(this.waitingRoom) // or  Option.fromNullable(this.waitingRoom.pop());
      .flatMap(f => f.pet)
      .forEach(this.groom);
  }

  findBlue(): Option<Pet> {
    return Option.find(this.kennel, (p => p.name === 'Blue'));
  }

  private groom() {}
}


```

```javascript
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Option_1 = require("../src/Option");
var PetType = (function () {
    function PetType() {
    }
    return PetType;
}());
PetType.DOG = 'DOG';
PetType.CAT = 'CAT';
var Pet = (function () {
    function Pet(name) {
        this.name = name;
        this.energy = [];
    }
    Pet.prototype.eat = function (food) {
        this.energy.push(food);
    };
    return Pet;
}());
var blueTheCat = new Pet('Blue');
var Family = (function () {
    function Family(pet) {
        this.pet = pet;
        this.food = [1, 1, 1, 1];
        this.secretStash = 1;
    }
    Family.prototype.feedCats = function () {
        this.pet
            .filter(function (pet) { return pet.type === PetType.CAT; })
            .forEach(this.feedPet.bind(this));
    };
    Family.prototype.callPet = function () {
        console.log(this.pet.map(function (p) { return p.name; }));
    };
    Family.prototype.feedBlue = function () {
        this.pet
            .filterValue(blueTheCat)
            .forEach(this.feedPet.bind(this));
    };
    Family.prototype.feedNotBlue = function () {
        this.pet
            .filterNotValue(blueTheCat)
            .forEach(this.feedPet.bind(this));
    };
    Family.prototype.getFood = function () {
        return Option_1.Option.fromNullable(this.food.pop()); // or Option.pop(this.food)
    };
    Family.prototype.getFoodOrSecretStashFood = function () {
        return this.getFood().orElse(Option_1.Option.of(this.secretStash));
    };
    Family.prototype.buyFood = function () {
        // decrement money
        return 1;
    };
    Family.prototype.feedPet = function (pet) {
        // example feed 1
        pet.eat(this.getFood().orThrow('No more food'));
        // example feed 2
        pet.eat(this.getFood().orCall(this.buyFood));
        // example feed 3
        pet.eat(this.getFood().or(this.secretStash));
        // example feed 4 not preferred since it is not as functional, but in certain instances can be helpful
        var food = this.getFood();
        if (food.isPresent()) {
            pet.eat(food.get()); // will throw if empty
        }
        else {
            pet.eat(this.secretStash);
        }
    };
    Family.prototype.hasCat = function () {
        return this.pet.exists(function (p) { return p.type === PetType.CAT; });
    };
    Family.prototype.hasBlue = function () {
        return this.pet.contains(blueTheCat);
    };
    return Family;
}());
var Groomer = (function () {
    function Groomer() {
        this.waitingRoom = [new Family(Option_1.Option.of(blueTheCat))];
        this.kennel = [blueTheCat, new Pet('Merlin')];
    }
    Groomer.prototype.groomPetFromWaitingRoom = function () {
        Option_1.Option.pop(this.waitingRoom) // or  Option.fromNullable(this.waitingRoom.pop());
            .flatMap(function (f) { return f.pet; })
            .forEach(this.groom);
    };
    Groomer.prototype.findBlue = function () {
        return Option_1.Option.find(this.kennel, (function (p) { return p.name === 'Blue'; }));
    };
    Groomer.prototype.groom = function () { };
    return Groomer;
}());


```

</div>
