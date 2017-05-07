---
layout: post
title: Exploring Options in Javascript/TypeScript
date: 2017-05-07T00:36:20-07:00
comments: true
categories: typescript options
---

To use this cs-options library you can bower install or npm install the `cs-option`
package and require Option via `import {Option} from 'cs-option'`. Check out the readme on
[GitHub](https://github.com/CodySchaaf/CsOption).

<div data-toggle></div>
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
