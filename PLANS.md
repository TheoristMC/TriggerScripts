```ts
addEffect(effectName: string, duration: number, amplifier?: number): void
```
<br>

```ts
chatLocal(message: string, userId: number): string
```
<br>

```ts
chatBroadcast(message: string): string
```
<br>

```ts
damage(amount: number): number
```
<br>

```ts
teleport(location: Vector3): void
```
<br>

```ts
saveGlobalData(id: string, data: string | number): void
```

```ts
getGlobalData(id: string): string | number
```
<br>

```ts
saveLocalData(id: string, data: string | number): void
```

```ts
getLocalData(id: string): string | number
```
<br>

```ts
bounce(horizStrength: number, vertStrength: number): void
```